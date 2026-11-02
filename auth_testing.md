# Auth Testing Playbook

Create test user & session in Mongo:
```
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({user_id: userId, email: 'test.user.' + Date.now() + '@example.com', name: 'Test User', picture: null,
  onboarded: true, language: 'it', city: 'Roma', hobbies: ['hiking','cinema','cooking','reading','photography','cycling','museums','board_games','yoga','live_music'],
  groups: [], location_consent: false, created_at: new Date().toISOString()});
db.user_sessions.insertOne({user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now() + 7*24*60*60*1000), created_at: new Date()});
print('Session token: ' + sessionToken);
"
```
Test: `curl -H "Authorization: Bearer TOKEN" $URL/api/auth/me`
Browser: frontend stores token in localStorage key `sbft_token` (also accepts cookie `session_token`).
Callback detection uses useLocation().hash.
