# Regression tests for Spend Better Free Time API (auth, profile, suggestions, favorites, history, groups, assistant, privacy, PWA)
import os
import uuid
import datetime
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
DEMO = {"email": "demo@sbft.app", "password": "Demo1234!"}
HOBBIES = ["hiking", "reading", "cinema", "cooking", "music", "yoga", "photography", "cycling", "museums", "board_games", "running"]


def _login(email, password):
    return requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)


@pytest.fixture(scope="module")
def demo_h():
    r = _login(**DEMO)
    if r.status_code != 200:
        pytest.skip(f"demo login failed {r.status_code} {r.text}")
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def new_user():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": "Test1234!", "name": "TEST_User"}, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    return {"email": email, "h": {"Authorization": f"Bearer {d['token']}"}, "user": d["user"]}


# ---- Health / auth ----
def test_root():
    r = requests.get(f"{API}/", timeout=20)
    assert r.status_code == 200 and r.json()["status"] == "ok"


def test_register_new_user_not_onboarded(new_user):
    u = new_user["user"]
    assert u["onboarded"] is False and u["email"] == new_user["email"]
    assert "password_hash" not in u and "_id" not in u


def test_register_duplicate(new_user):
    r = requests.post(f"{API}/auth/register", json={"email": new_user["email"], "password": "Test1234!", "name": "x"}, timeout=20)
    assert r.status_code == 400


def test_demo_login_and_me(demo_h):
    r = requests.get(f"{API}/auth/me", headers=demo_h, timeout=20)
    assert r.status_code == 200
    assert r.json()["email"] == DEMO["email"] and r.json()["onboarded"] is True


def test_wrong_password_401():
    r = _login(DEMO["email"], "WrongPass!")
    assert r.status_code == 401
    # reset counter with successful login
    assert _login(**DEMO).status_code == 200


def test_bruteforce_lock():
    email = f"lock_{uuid.uuid4().hex[:6]}@example.com"
    requests.post(f"{API}/auth/register", json={"email": email, "password": "Right1234", "name": "TEST_lock"}, timeout=20)
    codes = [_login(email, "bad-pass").status_code for _ in range(5)]
    assert codes == [401] * 5
    assert _login(email, "Right1234").status_code == 429


def test_unauth_me():
    assert requests.get(f"{API}/auth/me", timeout=20).status_code == 401


def test_forgot_and_reset_invalid(new_user):
    r = requests.post(f"{API}/auth/forgot", json={"email": new_user["email"]}, timeout=30)
    assert r.status_code == 200 and r.json()["ok"] is True
    r = requests.post(f"{API}/auth/forgot", json={"email": "nobody_x@example.com"}, timeout=30)
    assert r.status_code == 200
    r = requests.post(f"{API}/auth/reset", json={"token": "invalid", "password": "Newpass123"}, timeout=20)
    assert r.status_code == 400


# ---- Profile / onboarding ----
def test_profile_min_hobbies(new_user):
    r = requests.put(f"{API}/profile", headers=new_user["h"], json={"hobbies": HOBBIES[:5], "onboarded": True}, timeout=20)
    assert r.status_code == 400


def test_profile_max_hobbies(new_user):
    r = requests.put(f"{API}/profile", headers=new_user["h"], json={"hobbies": [f"h{i}" for i in range(16)]}, timeout=20)
    assert r.status_code == 400


def test_profile_onboard_ok(new_user):
    body = {"name": "TEST_User", "city": "Roma", "age": 30, "hobbies": HOBBIES, "onboarded": True,
            "groups": [{"platform": "facebook", "name": "TEST group", "url": ""}], "language": "it"}
    r = requests.put(f"{API}/profile", headers=new_user["h"], json=body, timeout=20)
    assert r.status_code == 200, r.text
    d = requests.get(f"{API}/auth/me", headers=new_user["h"], timeout=20).json()
    assert d["onboarded"] is True and d["hobbies"] == HOBBIES and d["city"] == "Roma" and len(d["groups"]) == 1


def test_profile_invalid_lang(new_user):
    r = requests.put(f"{API}/profile", headers=new_user["h"], json={"language": "xx"}, timeout=20)
    assert r.status_code == 400


# ---- Weather / suggestions ----
def test_weather(demo_h):
    d = datetime.date.today().isoformat()
    r = requests.get(f"{API}/weather", headers=demo_h, params={"date": d, "time": "15:00"}, timeout=30)
    assert r.status_code == 200
    w = r.json()
    assert w["place"] and w["weather"] and isinstance(w["weather"]["temperature"], (int, float))


def test_suggestions_generate(demo_h):
    d = datetime.date.today().isoformat()
    r = requests.post(f"{API}/suggestions", headers=demo_h, json={"date": d, "time": "16:00"}, timeout=120)
    assert r.status_code == 200, r.text
    data = r.json()
    assert len(data["activities"]) >= 4
    a = data["activities"][0]
    assert a["title"] and a["activity_id"].startswith("act_")
    lat = requests.get(f"{API}/suggestions/latest", headers=demo_h, timeout=20).json()
    assert lat["suggestion_id"] == data["suggestion_id"]


# ---- Favorites / history ----
def test_favorites_crud(demo_h):
    act = {"title": f"TEST_fav_{uuid.uuid4().hex[:5]}", "description": "x", "lat": 45.46, "lon": 9.19}
    r = requests.post(f"{API}/favorites", headers=demo_h, json=act, timeout=20)
    assert r.status_code == 200
    fid = r.json()["favorite_id"]
    r2 = requests.post(f"{API}/favorites", headers=demo_h, json=act, timeout=20)
    assert r2.json()["favorite_id"] == fid  # dedupe
    favs = requests.get(f"{API}/favorites", headers=demo_h, timeout=20).json()
    assert any(f["favorite_id"] == fid for f in favs)
    requests.delete(f"{API}/favorites/{fid}", headers=demo_h, timeout=20)
    favs = requests.get(f"{API}/favorites", headers=demo_h, timeout=20).json()
    assert not any(f["favorite_id"] == fid for f in favs)


def test_history_rate(demo_h):
    r = requests.post(f"{API}/history", headers=demo_h, json={"activity": {"title": "TEST_hist"}, "date": "2026-11-20"}, timeout=20)
    assert r.status_code == 200
    hid = r.json()["history_id"]
    assert requests.patch(f"{API}/history/{hid}", headers=demo_h, json={"rating": "up"}, timeout=20).status_code == 200
    h = [x for x in requests.get(f"{API}/history", headers=demo_h, timeout=20).json() if x["history_id"] == hid][0]
    assert h["rating"] == "up"
    assert requests.patch(f"{API}/history/{hid}", headers=demo_h, json={"rating": None}, timeout=20).status_code == 200
    assert requests.patch(f"{API}/history/nonexist", headers=demo_h, json={"rating": "up"}, timeout=20).status_code == 404
    requests.delete(f"{API}/history/{hid}", headers=demo_h, timeout=20)


# ---- Groups ----
def test_groups_flow(demo_h, new_user):
    g = requests.post(f"{API}/groups", headers=demo_h, json={"name": "TEST_group"}, timeout=20).json()
    gid, code = g["group_id"], g["invite_code"]
    assert len(code) == 6
    # outsider cannot read
    assert requests.get(f"{API}/groups/{gid}/messages", headers=new_user["h"], timeout=20).status_code == 404
    m = requests.post(f"{API}/groups/{gid}/messages", headers=demo_h, json={"text": "hello"}, timeout=20)
    assert m.status_code == 200 and m.json()["type"] == "text"
    assert requests.post(f"{API}/groups/{gid}/messages", headers=demo_h, json={"text": "  "}, timeout=20).status_code == 400
    p = requests.post(f"{API}/groups/{gid}/messages", headers=demo_h,
                      json={"proposal": {"title": "Pizza", "date": "2026-11-21", "time": "20:00", "place": "Milano"}}, timeout=20).json()
    assert p["type"] == "proposal"
    j = requests.post(f"{API}/groups/join", headers=new_user["h"], json={"invite_code": code.lower()}, timeout=20)
    assert j.status_code == 200
    assert requests.post(f"{API}/groups/join", headers=new_user["h"], json={"invite_code": "ZZZZZZ9"}, timeout=20).status_code == 404
    requests.post(f"{API}/groups/{gid}/messages/{p['message_id']}/vote", headers=demo_h, json={"vote": "yes"}, timeout=20)
    requests.post(f"{API}/groups/{gid}/messages/{p['message_id']}/vote", headers=new_user["h"], json={"vote": "no"}, timeout=20)
    msgs = requests.get(f"{API}/groups/{gid}/messages", headers=new_user["h"], timeout=20).json()
    prop = [x for x in msgs if x["message_id"] == p["message_id"]][0]
    assert sorted(prop["votes"].values()) == ["no", "yes"]
    det = requests.get(f"{API}/groups/{gid}", headers=new_user["h"], timeout=20).json()
    assert len(det["member_list"]) == 2
    assert requests.post(f"{API}/groups/{gid}/leave", headers=new_user["h"], timeout=20).status_code == 200
    requests.post(f"{API}/groups/{gid}/leave", headers=demo_h, timeout=20)


# ---- Assistant ----
def test_assistant_stream(new_user):
    r = requests.post(f"{API}/assistant/chat", headers=new_user["h"], json={"message": "Ciao, idea per stasera?"}, timeout=120, stream=True)
    assert r.status_code == 200
    body = "".join(chunk.decode() for chunk in r.iter_content(chunk_size=None))
    assert '"delta"' in body and '"done": true' in body
    msgs = requests.get(f"{API}/assistant/messages", headers=new_user["h"], timeout=20).json()
    assert [m["role"] for m in msgs] == ["user", "assistant"]
    requests.delete(f"{API}/assistant/messages", headers=new_user["h"], timeout=20)
    assert requests.get(f"{API}/assistant/messages", headers=new_user["h"], timeout=20).json() == []


# ---- Privacy / PWA ----
@pytest.mark.parametrize("lang", ["it", "en"])
def test_privacy(lang):
    r = requests.get(f"{API}/privacy", params={"lang": lang}, timeout=20)
    assert r.status_code == 200 and "text/html" in r.headers["content-type"] and "<html" in r.text.lower()


@pytest.mark.parametrize("path", ["/manifest.json", "/service-worker.js", "/icons/icon-192.png"])
def test_pwa_assets(path):
    r = requests.get(f"{BASE_URL}{path}", timeout=20)
    assert r.status_code == 200
    ct = r.headers.get("content-type", "")
    assert "text/html" not in ct, f"{path} served as html (SPA fallback?)"
