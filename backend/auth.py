import os
import uuid
import secrets
import hashlib
from html import escape
from datetime import timedelta
import bcrypt
import httpx
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from pydantic import BaseModel, EmailStr, Field
from core import db, now_utc, get_current_user, USER_PROJECTION
from emailer import send_email, EMAIL_FROM_NAME

router = APIRouter(prefix="/api/auth")
APP_URL = os.environ["APP_URL"]
MAX_ATTEMPTS = 5
LOCK_MINUTES = 15


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)
    language: str = "it"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class GoogleIn(BaseModel):
    session_id: str


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=6, max_length=128)


def new_user_doc(email, name, **extra):
    return {
        "user_id": f"user_{uuid.uuid4().hex[:12]}", "email": email, "name": name,
        "picture": None, "avatar_seed": name, "onboarded": False, "language": "it",
        "age": None, "city": "", "gender": "", "hobbies": [], "groups": [],
        "location_consent": False, "lat": None, "lon": None,
        "created_at": now_utc().isoformat(), **extra,
    }


async def create_session(user_id: str, response: Response) -> str:
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": token,
        "expires_at": now_utc() + timedelta(days=7), "created_at": now_utc(),
    })
    response.set_cookie("session_token", token, httponly=True, secure=True, samesite="none",
                        path="/", max_age=7 * 24 * 3600)
    return token


async def user_out(user_id):
    doc = await db.users.find_one({"user_id": user_id}, USER_PROJECTION)
    doc.pop("_id", None)
    return doc


@router.post("/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="email_exists")
    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    doc = new_user_doc(email, body.name.strip(), password_hash=hashed, auth_provider="email",
                       language=body.language)
    await db.users.insert_one(doc)
    token = await create_session(doc["user_id"], response)
    return {"token": token, "user": await user_out(doc["user_id"])}


@router.post("/login")
async def login(body: LoginIn, request: Request, response: Response):
    email = body.email.lower()
    ip = request.client.host if request.client else "?"
    key = f"{ip}:{email}"
    att = await db.login_attempts.find_one({"key": key}, {"_id": 0})
    if att and att.get("locked_until") and att["locked_until"] > now_utc().isoformat():
        raise HTTPException(status_code=429, detail="too_many_attempts")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    ok = bool(user and user.get("password_hash") and
              bcrypt.checkpw(body.password.encode(), user["password_hash"].encode()))
    if not ok:
        count = (att or {}).get("count", 0) + 1
        upd = {"count": count}
        if count >= MAX_ATTEMPTS:
            upd = {"count": 0, "locked_until": (now_utc() + timedelta(minutes=LOCK_MINUTES)).isoformat()}
        await db.login_attempts.update_one({"key": key}, {"$set": upd}, upsert=True)
        raise HTTPException(status_code=401, detail="invalid_credentials")
    await db.login_attempts.delete_one({"key": key})
    token = await create_session(user["user_id"], response)
    return {"token": token, "user": await user_out(user["user_id"])}


@router.post("/google/session")
async def google_session(body: GoogleIn, response: Response):
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                        headers={"X-Session-ID": body.session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="invalid_session")
    data = r.json()
    email = data["email"].lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"picture": data.get("picture")}})
        user_id = user["user_id"]
    else:
        doc = new_user_doc(email, data.get("name") or email.split("@")[0],
                           picture=data.get("picture"), auth_provider="google")
        await db.users.insert_one(doc)
        user_id = doc["user_id"]
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({
        "user_id": user_id, "session_token": token,
        "expires_at": now_utc() + timedelta(days=7), "created_at": now_utc(),
    })
    response.set_cookie("session_token", token, httponly=True, secure=True, samesite="none",
                        path="/", max_age=7 * 24 * 3600)
    return {"token": token, "user": await user_out(user_id)}


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return user


@router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"ok": True}


RESET_TEXT = {
    "it": ("Reimposta la tua password", "Ciao {name}, abbiamo ricevuto una richiesta di reimpostazione della password.",
           "Reimposta password", "Il link scade tra 1 ora. Se non hai richiesto tu il cambio, ignora questa email."),
    "en": ("Reset your password", "Hi {name}, we received a request to reset your password.",
           "Reset password", "The link expires in 1 hour. If you didn't request this, ignore this email."),
}


@router.post("/forgot")
async def forgot(body: ForgotIn):
    email = body.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return {"ok": True}
    since = (now_utc() - timedelta(hours=1)).isoformat()
    if await db.password_resets.count_documents({"user_id": user["user_id"], "created_at": {"$gt": since}}) >= 3:
        return {"ok": True}
    token = secrets.token_urlsafe(32)
    await db.password_resets.insert_one({
        "user_id": user["user_id"], "token_hash": hashlib.sha256(token.encode()).hexdigest(),
        "expires_at": (now_utc() + timedelta(hours=1)).isoformat(), "used": False,
        "created_at": now_utc().isoformat(),
    })
    subject, intro, cta, note = RESET_TEXT.get(user.get("language"), RESET_TEXT["en"])
    link = f"{APP_URL}/reset-password?token={token}"
    html = (f'<table role="presentation" width="100%"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#0F172A">'
            f'<h2 style="color:#E83D84">{escape(EMAIL_FROM_NAME)}</h2>'
            f'<p>{escape(intro.format(name=user["name"]))}</p>'
            f'<p><a href="{escape(link)}" style="background:#E83D84;color:#fff;padding:12px 22px;border-radius:999px;'
            f'text-decoration:none;display:inline-block">{escape(cta)}</a></p>'
            f'<p style="font-size:12px;color:#64748B">{escape(note)}</p>'
            f'<p style="font-size:12px;color:#94A3B8">{escape(EMAIL_FROM_NAME)}</p></td></tr></table>')
    await send_email(to=user["email"], subject=f"{subject} - {EMAIL_FROM_NAME}", html=html)
    return {"ok": True}


@router.post("/reset")
async def reset(body: ResetIn):
    th = hashlib.sha256(body.token.encode()).hexdigest()
    rec = await db.password_resets.find_one({"token_hash": th, "used": False}, {"_id": 0})
    if not rec or rec["expires_at"] < now_utc().isoformat():
        raise HTTPException(status_code=400, detail="invalid_token")
    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one({"user_id": rec["user_id"]}, {"$set": {"password_hash": hashed}})
    await db.password_resets.update_one({"token_hash": th}, {"$set": {"used": True}})
    await db.user_sessions.delete_many({"user_id": rec["user_id"]})
    return {"ok": True}
