# Spend better free time – Web/PWA

## Problem statement
Web version (responsive + installable PWA) of "Spend better free time". React + FastAPI + MongoDB. Email/password + Emergent Google login, password reset by email, 4-step onboarding (personal data, 10-15 ordered hobbies, FB/IG groups, optional location). Home with date/time + AI suggestions (Emergent LLM key) using hobbies, location/city, weather; favorites; history with thumbs; activity map; group chat with proposals; AI assistant; profile with avatar; donations PayPal/IBAN; 8 languages (it default); privacy at /api/privacy. No AdMob/IAP. Pink theme.

## User choices
- Email: Emergent Managed Resend. Weather: Open-Meteo (no key).
- Donations: PayPal giuseppenoe@libero.it, IBAN IT91B0306946250100000001330, Giuseppe Noè.

## Architecture
- Backend: server.py (routes), auth.py, core.py, emailer.py, services.py (weather/geocode/LLM gpt-5.4), privacy.py
- Frontend: pages Login, ResetPassword, AuthCallback, Onboarding, Home, Saved, MapPage (Leaflet), Groups, GroupChat (polling 4s), Assistant (SSE stream), Profile, Donate; i18n custom context (RTL for ar); manifest + service worker
- Note: no imported repo was found in /app; backend written from scratch.

## Implemented (2026-11-02)
- All features above coded. Verified by curl: register/login/profile/suggestions. Screenshot: login + home OK on mobile.

## Not yet verified / backlog
- P0: full E2E test (testing agent) of favorites, history, map, groups, assistant, profile, donate, reset email, Google login
- P1: privacy policy only it/en (others fallback en); avatar = preset generated avatars (no photo upload)
- P2: APP_URL in backend .env must match production domain for reset links; push notifications for group chat
