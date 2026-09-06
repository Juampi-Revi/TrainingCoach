#!/usr/bin/env bash
set -uo pipefail

API="${API_BASE:-http://localhost:3013/api/v1}"
WEB="${WEB_BASE:-http://localhost:3011}"
COACH_EMAIL="${COACH_EMAIL:-coach@example.com}"
CLIENT_EMAIL="${CLIENT_EMAIL:-client@example.com}"
PASSWORD="${PASSWORD:-12345678}"

PASS=0
FAIL=0

ok() { PASS=$((PASS + 1)); echo "✅ $1"; }
bad() { FAIL=$((FAIL + 1)); echo "❌ $1"; }

json() {
  python3 -c "$1" <<<"$2"
}

COACH=$(curl -sf -X POST "$API/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$COACH_EMAIL\",\"password\":\"$PASSWORD\"}")
if echo "$COACH" | grep -q '"token"'; then ok "Coach login"; else bad "Coach login"; fi
CTOKEN=$(json 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("token",""))' "$COACH")
REFRESH=$(json 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("refreshToken",""))' "$COACH")
if [ -n "$REFRESH" ]; then
  REFRESHED=$(curl -s -X POST "$API/auth/refresh" -H 'Content-Type: application/json' -d "{\"refreshToken\":\"$REFRESH\"}")
  if echo "$REFRESHED" | grep -q '"token"'; then ok "Auth refresh"; else bad "Auth refresh"; fi
else
  bad "Auth refresh (no refresh token in login response)"
fi

CLIENT=$(curl -sf -X POST "$API/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$CLIENT_EMAIL\",\"password\":\"$PASSWORD\"}")
CLTOKEN=$(json 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("token",""))' "$CLIENT")

if echo "$CLIENT" | grep -q '"token"'; then ok "Client login"; else bad "Client login"; fi

ALL=$(curl -sf "$API/coach/exercises?limit=80" -H "Authorization: Bearer $CTOKEN")
COUNT=$(json 'import sys,json; print(len(json.load(sys.stdin).get("data",[])))' "$ALL")
if [ "${COUNT:-0}" -ge 80 ]; then ok "Exercises list limit=80 ($COUNT items)"; else bad "Exercises list expected >=80 got $COUNT"; fi

GUIDE=$(curl -sf "$API/coach/exercises?guide=true&limit=100" -H "Authorization: Bearer $CTOKEN")
G_COUNT=$(json 'import sys,json; print(len(json.load(sys.stdin).get("data",[])))' "$GUIDE")
G_ALL=$(json 'import sys,json; d=json.load(sys.stdin).get("data",[]); print(all(x.get("isGuide") for x in d))' "$GUIDE")
if [ "${G_COUNT:-0}" -ge 100 ] && [ "$G_ALL" = "True" ]; then ok "Guide filter ($G_COUNT items)"; else bad "Guide filter count=$G_COUNT isGuideAll=$G_ALL"; fi

BASIC=$(curl -sf "$API/coach/exercises?basic=true&limit=80" -H "Authorization: Bearer $CTOKEN")
B_COUNT=$(json 'import sys,json; print(len(json.load(sys.stdin).get("data",[])))' "$BASIC")
B_ALL=$(json 'import sys,json; d=json.load(sys.stdin).get("data",[]); print(all(x.get("isBasic") for x in d))' "$BASIC")
if [ "${B_COUNT:-0}" -ge 1 ] && [ "$B_ALL" = "True" ]; then ok "Basic filter ($B_COUNT items)"; else bad "Basic filter count=$B_COUNT"; fi

ILL=$(curl -sf "$API/coach/exercises?illustrated=true&limit=100" -H "Authorization: Bearer $CTOKEN")
I_COUNT=$(json 'import sys,json; print(len(json.load(sys.stdin).get("data",[])))' "$ILL")
I_ALL=$(json 'import sys,json; d=json.load(sys.stdin).get("data",[]); print(all(x.get("hasIllustration") for x in d))' "$ILL")
if [ "${I_COUNT:-0}" -ge 100 ] && [ "$I_ALL" = "True" ]; then ok "Illustrated filter ($I_COUNT items)"; else bad "Illustrated filter count=$I_COUNT"; fi

HAS_META=$(json 'import sys,json; d=json.load(sys.stdin).get("data",[]); g=sum(1 for x in d if x.get("isGuide")); print(g>0 and all("hasIllustration" in x for x in d[:5]))' "$ALL")
if [ "$HAS_META" = "True" ]; then ok "Exercise metadata (isGuide, hasIllustration)"; else bad "Exercise metadata missing"; fi

TEMPLATES=$(curl -sf "$API/coach/workouts" -H "Authorization: Bearer $CTOKEN")
TID=$(json 'import sys,json; d=json.load(sys.stdin).get("data",[]); print(d[0]["id"] if d else "")' "$TEMPLATES")
if [ -n "$TID" ]; then
  DETAIL=$(curl -sf "$API/coach/workouts/$TID" -H "Authorization: Bearer $CTOKEN")
  HAS_SRC=$(json 'import sys,json; t=json.load(sys.stdin).get("data",{}); ex=t.get("exercises",[]); print(len(ex)>0 and "source" in ex[0].get("exercise",{}))' "$DETAIL")
  if [ "$HAS_SRC" = "True" ]; then ok "Workout template source fields"; else bad "Workout template missing source fields"; fi
else bad "No workout templates found"; fi

SESSIONS=$(curl -sf "$API/client/sessions?limit=5" -H "Authorization: Bearer $CLTOKEN")
SID=$(json 'import sys,json; d=json.load(sys.stdin).get("data",{}).get("items",[]); print(d[0]["id"] if d else "")' "$SESSIONS")
if [ -n "$SID" ]; then
  SESS=$(curl -sf "$API/client/sessions/$SID" -H "Authorization: Bearer $CLTOKEN")
  SESS_OK=$(json 'import sys,json; s=json.load(sys.stdin).get("data",{}); ex=s.get("exercises",[]); print(len(ex)>0 and "sourceId" in ex[0].get("exercise",{}))' "$SESS")
  if [ "$SESS_OK" = "True" ]; then ok "Client session exposes source/sourceId"; else bad "Client session missing source fields"; fi
else bad "No client sessions in seed"; fi

LB=$(curl -sf "$API/client/leaderboard?friendsOnly=true&metric=workouts&period=weekly" -H "Authorization: Bearer $CLTOKEN")
if echo "$LB" | grep -q '"data"'; then ok "Leaderboard friends"; else bad "Leaderboard friends"; fi

for path in /login /coach/ejercicios /panel /semana; do
  CODE=$(curl -sf -o /dev/null -w '%{http_code}' "$WEB$path")
  if [ "$CODE" = "200" ]; then ok "Web $path"; else bad "Web $path ($CODE)"; fi
done

LOGOUT_CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/auth/logout" -H "Authorization: Bearer $CTOKEN")
if [ "$LOGOUT_CODE" = "200" ]; then ok "Coach logout"; else bad "Coach logout ($LOGOUT_CODE)"; fi

echo ""
echo "=== SMOKE SUMMARY: $PASS passed, $FAIL failed ==="
exit "$FAIL"
