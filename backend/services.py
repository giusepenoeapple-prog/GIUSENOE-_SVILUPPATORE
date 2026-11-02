import os
import json
import uuid
import logging
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)
LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
LLM_PROVIDER, LLM_MODEL = "openai", "gpt-5.4"

LANG_NAMES = {"it": "Italian", "en": "English", "fr": "French", "es": "Spanish", "de": "German",
              "zh": "Simplified Chinese", "ar": "Arabic", "pt": "Portuguese"}

WMO = {0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast", 45: "fog", 48: "fog",
       51: "light drizzle", 53: "drizzle", 55: "dense drizzle", 61: "light rain", 63: "rain", 65: "heavy rain",
       71: "light snow", 73: "snow", 75: "heavy snow", 80: "rain showers", 81: "rain showers",
       82: "violent showers", 95: "thunderstorm", 96: "thunderstorm with hail", 99: "thunderstorm with hail"}


async def geocode_city(city: str):
    if not city:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get("https://geocoding-api.open-meteo.com/v1/search",
                            params={"name": city, "count": 1, "language": "it"})
        res = r.json().get("results") or []
        if res:
            return {"lat": res[0]["latitude"], "lon": res[0]["longitude"], "name": res[0]["name"]}
    except Exception as e:
        logger.warning(f"geocode failed: {e}")
    return None


async def reverse_geocode(lat, lon):
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get("https://nominatim.openstreetmap.org/reverse",
                            params={"lat": lat, "lon": lon, "format": "json", "zoom": 10},
                            headers={"User-Agent": "SpendBetterFreeTime/1.0"})
        a = r.json().get("address", {})
        return a.get("city") or a.get("town") or a.get("village") or a.get("county")
    except Exception:
        return None


async def get_weather(lat, lon, date: str, time: str):
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get("https://api.open-meteo.com/v1/forecast", params={
                "latitude": lat, "longitude": lon, "timezone": "auto",
                "hourly": "temperature_2m,precipitation_probability,weather_code,wind_speed_10m",
                "start_date": date, "end_date": date})
        if r.status_code != 200:
            return None
        h = r.json()["hourly"]
        hour = int((time or "12:00").split(":")[0])
        target = f"{date}T{hour:02d}:00"
        i = h["time"].index(target) if target in h["time"] else 12
        code = h["weather_code"][i]
        return {"temperature": h["temperature_2m"][i], "precipitation_probability": h["precipitation_probability"][i],
                "wind_speed": h["wind_speed_10m"][i], "code": code, "description": WMO.get(code, "variable")}
    except Exception as e:
        logger.warning(f"weather failed: {e}")
        return None


def _extract_json(text: str):
    start, end = text.find("{"), text.rfind("}")
    return json.loads(text[start:end + 1])


async def generate_activities(user: dict, date: str, time: str, place: str, lat, lon, weather, liked, disliked):
    lang = LANG_NAMES.get(user.get("language"), "Italian")
    hobbies = ", ".join(f"{i + 1}. {h}" for i, h in enumerate(user.get("hobbies", [])))
    groups = ", ".join(f"{g.get('platform')}: {g.get('name')}" for g in user.get("groups", []))
    w = f"{weather['description']}, {weather['temperature']}°C, rain probability {weather['precipitation_probability']}%" if weather else "unknown"
    prompt = f"""Suggest 6 concrete free-time activities.
Date: {date}, starting time: {time}. Location: {place} (lat {lat}, lon {lon}). Weather forecast: {w}.
User: age {user.get('age') or 'n/a'}, gender {user.get('gender') or 'n/a'}.
Hobbies in priority order (most important first): {hobbies or 'none'}.
Social groups the user follows: {groups or 'none'}.
Activities the user liked before: {', '.join(liked) or 'none'}. Disliked: {', '.join(disliked) or 'none'}.
Rules: favour top-priority hobbies, adapt to weather (indoor if rain/cold), suggest real places near the location with realistic coordinates, vary categories.
Answer ONLY with JSON: {{"activities":[{{"title":"","description":"max 2 sentences","category":"one of the user hobbies or a short category","duration_minutes":90,"indoor":true,"weather_note":"short","place":"place name and area","lat":0.0,"lon":0.0,"cost":"free|low|medium|high","match_score":90}}]}}
All text fields in {lang}."""
    chat = LlmChat(api_key=LLM_KEY, session_id=f"sugg_{uuid.uuid4().hex}",
                   system_message="You are a leisure planner. You output strict JSON only.").with_model(LLM_PROVIDER, LLM_MODEL)
    text = await chat.send_message(UserMessage(text=prompt))
    acts = _extract_json(text).get("activities", [])
    for a in acts:
        a["activity_id"] = f"act_{uuid.uuid4().hex[:10]}"
    return acts


def assistant_chat(user: dict, history: list):
    lang = LANG_NAMES.get(user.get("language"), "Italian")
    past = "\n".join(f"{m['role']}: {m['content']}" for m in history[-12:])
    system = (f"You are the friendly AI assistant of the app 'Spend better free time'. Help the user plan free time, "
              f"activities, outings with friends. Be concise and practical, use short lists. Reply in {lang} unless the user writes in another language. "
              f"User: name {user.get('name')}, city {user.get('city') or 'n/a'}, age {user.get('age') or 'n/a'}, "
              f"hobbies by priority: {', '.join(user.get('hobbies', [])) or 'n/a'}.\n"
              f"Previous conversation:\n{past or '(none)'}")
    return LlmChat(api_key=LLM_KEY, session_id=f"asst_{uuid.uuid4().hex}", system_message=system).with_model(LLM_PROVIDER, LLM_MODEL)
