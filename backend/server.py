import os
import json
import uuid
import random
import string
import logging
from typing import List, Optional, Literal
from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from emergentintegrations.llm.chat import UserMessage, TextDelta, StreamDone
from core import db, client, now_utc, get_current_user, USER_PROJECTION
from auth import router as auth_router
from services import geocode_city, reverse_geocode, get_weather, generate_activities, assistant_chat
from privacy import privacy_html

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Spend better free time")
api = APIRouter(prefix="/api")
LANGS = ("it", "en", "fr", "es", "de", "zh", "ar", "pt")


def clean(doc):
    if doc:
        doc.pop("_id", None)
    return doc


# ---------- Models ----------
class GroupLink(BaseModel):
    platform: Literal["facebook", "instagram"]
    name: str = Field(max_length=120)
    url: str = Field(default="", max_length=300)


class ProfileIn(BaseModel):
    name: Optional[str] = Field(default=None, max_length=80)
    age: Optional[int] = Field(default=None, ge=10, le=110)
    city: Optional[str] = Field(default=None, max_length=100)
    gender: Optional[str] = Field(default=None, max_length=30)
    hobbies: Optional[List[str]] = None
    groups: Optional[List[GroupLink]] = None
    location_consent: Optional[bool] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    language: Optional[str] = None
    avatar_seed: Optional[str] = Field(default=None, max_length=60)
    avatar_style: Optional[str] = Field(default=None, max_length=30)
    use_picture: Optional[bool] = None
    onboarded: Optional[bool] = None


class SuggestIn(BaseModel):
    date: str
    time: str
    lat: Optional[float] = None
    lon: Optional[float] = None


class Activity(BaseModel):
    activity_id: Optional[str] = None
    title: str
    description: str = ""
    category: str = ""
    duration_minutes: Optional[int] = None
    indoor: Optional[bool] = None
    weather_note: str = ""
    place: str = ""
    lat: Optional[float] = None
    lon: Optional[float] = None
    cost: str = ""
    match_score: Optional[int] = None


class HistoryIn(BaseModel):
    activity: Activity
    date: Optional[str] = None


class RatingIn(BaseModel):
    rating: Optional[Literal["up", "down"]] = None


class GroupIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=300)


class JoinIn(BaseModel):
    invite_code: str


class Proposal(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    date: str = ""
    time: str = ""
    place: str = Field(default="", max_length=200)


class MessageIn(BaseModel):
    text: str = Field(default="", max_length=2000)
    proposal: Optional[Proposal] = None


class VoteIn(BaseModel):
    vote: Literal["yes", "no"]


class AssistantIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


# ---------- Profile ----------
@api.get("/")
async def root():
    return {"app": "Spend better free time", "status": "ok"}


@api.put("/profile")
async def update_profile(body: ProfileIn, user=Depends(get_current_user)):
    data = body.model_dump(exclude_none=True)
    if "hobbies" in data:
        hobbies = [h.strip() for h in data["hobbies"] if h.strip()]
        if len(hobbies) > 15:
            raise HTTPException(status_code=400, detail="max_15_hobbies")
        if data.get("onboarded") and len(hobbies) < 10:
            raise HTTPException(status_code=400, detail="min_10_hobbies")
        data["hobbies"] = hobbies
    if "language" in data and data["language"] not in LANGS:
        raise HTTPException(status_code=400, detail="invalid_language")
    if data.get("location_consent") is False:
        data["lat"], data["lon"] = None, None
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": data})
    doc = await db.users.find_one({"user_id": user["user_id"]}, USER_PROJECTION)
    return clean(doc)


@api.get("/weather")
async def weather(date: str, time: str = "12:00", lat: Optional[float] = None, lon: Optional[float] = None,
                  user=Depends(get_current_user)):
    loc = await resolve_location(user, lat, lon)
    if not loc:
        return {"weather": None, "place": None}
    return {"weather": await get_weather(loc["lat"], loc["lon"], date, time), "place": loc["name"]}


async def resolve_location(user, lat, lon):
    if lat is None and user.get("location_consent") and user.get("lat") is not None:
        lat, lon = user["lat"], user["lon"]
    if lat is not None and lon is not None:
        name = await reverse_geocode(lat, lon) or user.get("city") or f"{lat:.3f},{lon:.3f}"
        return {"lat": lat, "lon": lon, "name": name}
    return await geocode_city(user.get("city", ""))


# ---------- Suggestions ----------
@api.post("/suggestions")
async def suggestions(body: SuggestIn, user=Depends(get_current_user)):
    if body.lat is not None and user.get("location_consent"):
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"lat": body.lat, "lon": body.lon}})
    loc = await resolve_location(user, body.lat, body.lon) or {"lat": None, "lon": None, "name": user.get("city") or "unknown"}
    w = await get_weather(loc["lat"], loc["lon"], body.date, body.time) if loc["lat"] is not None else None
    hist = await db.history.find({"user_id": user["user_id"], "rating": {"$ne": None}}, {"_id": 0}).sort("created_at", -1).to_list(30)
    liked = [h["activity"]["title"] for h in hist if h["rating"] == "up"]
    disliked = [h["activity"]["title"] for h in hist if h["rating"] == "down"]
    try:
        acts = await generate_activities(user, body.date, body.time, loc["name"], loc["lat"], loc["lon"], w, liked, disliked)
    except Exception as e:
        logger.error(f"LLM error: {e}")
        raise HTTPException(status_code=502, detail="ai_unavailable")
    doc = {"suggestion_id": f"sug_{uuid.uuid4().hex[:10]}", "user_id": user["user_id"], "date": body.date,
           "time": body.time, "place": loc["name"], "lat": loc["lat"], "lon": loc["lon"], "weather": w,
           "activities": acts, "created_at": now_utc().isoformat()}
    await db.suggestions.insert_one(doc)
    return clean(doc)


@api.get("/suggestions/latest")
async def latest_suggestions(user=Depends(get_current_user)):
    doc = await db.suggestions.find_one({"user_id": user["user_id"]}, {"_id": 0}, sort=[("created_at", -1)])
    return clean(doc) or {}


# ---------- Favorites ----------
@api.get("/favorites")
async def list_favorites(user=Depends(get_current_user)):
    return await db.favorites.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.post("/favorites")
async def add_favorite(body: Activity, user=Depends(get_current_user)):
    existing = await db.favorites.find_one({"user_id": user["user_id"], "activity.title": body.title}, {"_id": 0})
    if existing:
        return clean(existing)
    doc = {"favorite_id": f"fav_{uuid.uuid4().hex[:10]}", "user_id": user["user_id"],
           "activity": body.model_dump(), "created_at": now_utc().isoformat()}
    await db.favorites.insert_one(doc)
    return clean(doc)


@api.delete("/favorites/{favorite_id}")
async def delete_favorite(favorite_id: str, user=Depends(get_current_user)):
    await db.favorites.delete_one({"user_id": user["user_id"], "favorite_id": favorite_id})
    return {"ok": True}


# ---------- History ----------
@api.get("/history")
async def list_history(user=Depends(get_current_user)):
    return await db.history.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.post("/history")
async def add_history(body: HistoryIn, user=Depends(get_current_user)):
    doc = {"history_id": f"his_{uuid.uuid4().hex[:10]}", "user_id": user["user_id"], "activity": body.activity.model_dump(),
           "date": body.date or now_utc().date().isoformat(), "rating": None, "created_at": now_utc().isoformat()}
    await db.history.insert_one(doc)
    return clean(doc)


@api.patch("/history/{history_id}")
async def rate_history(history_id: str, body: RatingIn, user=Depends(get_current_user)):
    res = await db.history.update_one({"user_id": user["user_id"], "history_id": history_id}, {"$set": {"rating": body.rating}})
    if not res.matched_count:
        raise HTTPException(status_code=404, detail="not_found")
    return {"ok": True, "rating": body.rating}


@api.delete("/history/{history_id}")
async def delete_history(history_id: str, user=Depends(get_current_user)):
    await db.history.delete_one({"user_id": user["user_id"], "history_id": history_id})
    return {"ok": True}


# ---------- Groups ----------
def new_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


async def member_group(group_id, user):
    g = await db.groups.find_one({"group_id": group_id, "members": user["user_id"]}, {"_id": 0})
    if not g:
        raise HTTPException(status_code=404, detail="group_not_found")
    return g


@api.get("/groups")
async def list_groups(user=Depends(get_current_user)):
    return await db.groups.find({"members": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api.post("/groups")
async def create_group(body: GroupIn, user=Depends(get_current_user)):
    doc = {"group_id": f"grp_{uuid.uuid4().hex[:10]}", "name": body.name, "description": body.description,
           "invite_code": new_code(), "members": [user["user_id"]], "created_by": user["user_id"],
           "created_at": now_utc().isoformat()}
    await db.groups.insert_one(doc)
    return clean(doc)


@api.post("/groups/join")
async def join_group(body: JoinIn, user=Depends(get_current_user)):
    g = await db.groups.find_one({"invite_code": body.invite_code.strip().upper()}, {"_id": 0})
    if not g:
        raise HTTPException(status_code=404, detail="invalid_code")
    await db.groups.update_one({"group_id": g["group_id"]}, {"$addToSet": {"members": user["user_id"]}})
    return await member_group(g["group_id"], user)


@api.get("/groups/{group_id}")
async def get_group(group_id: str, user=Depends(get_current_user)):
    g = await member_group(group_id, user)
    members = await db.users.find({"user_id": {"$in": g["members"]}}, {"_id": 0, "user_id": 1, "name": 1}).to_list(200)
    g["member_list"] = members
    return g


@api.post("/groups/{group_id}/leave")
async def leave_group(group_id: str, user=Depends(get_current_user)):
    await member_group(group_id, user)
    await db.groups.update_one({"group_id": group_id}, {"$pull": {"members": user["user_id"]}})
    return {"ok": True}


@api.get("/groups/{group_id}/messages")
async def get_messages(group_id: str, user=Depends(get_current_user)):
    await member_group(group_id, user)
    return await db.messages.find({"group_id": group_id}, {"_id": 0}).sort("created_at", 1).to_list(500)


@api.post("/groups/{group_id}/messages")
async def post_message(group_id: str, body: MessageIn, user=Depends(get_current_user)):
    await member_group(group_id, user)
    if not body.text.strip() and not body.proposal:
        raise HTTPException(status_code=400, detail="empty_message")
    doc = {"message_id": f"msg_{uuid.uuid4().hex[:10]}", "group_id": group_id, "user_id": user["user_id"],
           "user_name": user["name"], "type": "proposal" if body.proposal else "text", "text": body.text.strip(),
           "proposal": body.proposal.model_dump() if body.proposal else None, "votes": {},
           "created_at": now_utc().isoformat()}
    await db.messages.insert_one(doc)
    return clean(doc)


@api.post("/groups/{group_id}/messages/{message_id}/vote")
async def vote(group_id: str, message_id: str, body: VoteIn, user=Depends(get_current_user)):
    await member_group(group_id, user)
    res = await db.messages.update_one({"group_id": group_id, "message_id": message_id, "type": "proposal"},
                                       {"$set": {f"votes.{user['user_id']}": body.vote}})
    if not res.matched_count:
        raise HTTPException(status_code=404, detail="not_found")
    return {"ok": True}


# ---------- Assistant ----------
@api.get("/assistant/messages")
async def assistant_messages(user=Depends(get_current_user)):
    return await db.assistant_messages.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", 1).to_list(200)


@api.delete("/assistant/messages")
async def clear_assistant(user=Depends(get_current_user)):
    await db.assistant_messages.delete_many({"user_id": user["user_id"]})
    return {"ok": True}


@api.post("/assistant/chat")
async def assistant(body: AssistantIn, user=Depends(get_current_user)):
    history = await db.assistant_messages.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", 1).to_list(200)
    chat = assistant_chat(user, history)
    await db.assistant_messages.insert_one({"user_id": user["user_id"], "role": "user", "content": body.message,
                                            "created_at": now_utc().isoformat()})

    async def gen():
        full = ""
        try:
            async for ev in chat.stream_message(UserMessage(text=body.message)):
                if isinstance(ev, TextDelta):
                    full += ev.content
                    yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            logger.error(f"assistant error: {e}")
            yield f"data: {json.dumps({'error': 'ai_unavailable'})}\n\n"
        if full:
            await db.assistant_messages.insert_one({"user_id": user["user_id"], "role": "assistant", "content": full,
                                                    "created_at": now_utc().isoformat()})
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


# ---------- Privacy ----------
@api.get("/privacy", response_class=HTMLResponse)
async def privacy(lang: str = "it"):
    return privacy_html(lang)


app.include_router(auth_router)
app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True,
                   allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
                   allow_methods=["*"], allow_headers=["*"])


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
