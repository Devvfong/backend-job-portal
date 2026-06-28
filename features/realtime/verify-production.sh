#!/usr/bin/env bash
# Verify production security + realtime wiring (nginx, CORS, WS, Docker bind).
# Usage:
#   bash features/realtime/verify-production.sh           # remote checks (curl + WS)
#   bash features/realtime/verify-production.sh --vps     # also run on-server checks (run on VPS)
#   ACCESS_TOKEN=<jwt> bash features/realtime/verify-production.sh  # full WS auth test
set -euo pipefail

API_URL="${API_URL:-https://devqii.me}"
FRONTEND_URL="${FRONTEND_URL:-https://nexthire.devqii.me}"
WS_URL="${WS_URL:-wss://nexthire.devqii.me/ws}"
ALLOWED_ORIGIN="${ALLOWED_ORIGIN:-https://nexthire.devqii.me}"
BLOCKED_ORIGIN="${BLOCKED_ORIGIN:-https://evil.example}"
ON_VPS=false

if [[ "${1:-}" == "--vps" ]]; then
  ON_VPS=true
fi

PASS=0
FAIL=0
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

pass() {
  PASS=$((PASS + 1))
  echo "  PASS: $1"
}

fail() {
  FAIL=$((FAIL + 1))
  echo "  FAIL: $1"
}

header() {
  echo ""
  echo "== $1 =="
}

curl_headers() {
  local url="$1"
  shift
  curl -sS -I --max-time 15 "$@" "$url"
}

header "Public reachability"
if curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "${API_URL}/api/v1/jobs" | grep -q '^200$'; then
  pass "API ${API_URL}/api/v1/jobs returns 200"
else
  fail "API ${API_URL}/api/v1/jobs not 200"
fi

if curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "${FRONTEND_URL}/" | grep -q '^200$'; then
  pass "Frontend ${FRONTEND_URL}/ returns 200"
else
  fail "Frontend ${FRONTEND_URL}/ not 200"
fi

header "CORS lockdown (API)"
ALLOWED_HEADERS="$(curl_headers "${API_URL}/api/v1/jobs" -H "Origin: ${ALLOWED_ORIGIN}")"
if echo "$ALLOWED_HEADERS" | grep -qi "access-control-allow-origin: ${ALLOWED_ORIGIN}"; then
  pass "Allowed origin ${ALLOWED_ORIGIN} gets Access-Control-Allow-Origin"
else
  fail "Allowed origin ${ALLOWED_ORIGIN} missing Access-Control-Allow-Origin"
fi

BLOCKED_HEADERS="$(curl_headers "${API_URL}/api/v1/jobs" -H "Origin: ${BLOCKED_ORIGIN}")"
if echo "$BLOCKED_HEADERS" | grep -qi "access-control-allow-origin:"; then
  fail "Blocked origin ${BLOCKED_ORIGIN} received Access-Control-Allow-Origin"
else
  pass "Blocked origin ${BLOCKED_ORIGIN} has no Access-Control-Allow-Origin"
fi

header "Frontend security headers"
FE_HEADERS="$(curl_headers "${FRONTEND_URL}/")"
for H in \
  "strict-transport-security:" \
  "x-frame-options:" \
  "x-content-type-options:" \
  "referrer-policy:" \
  "permissions-policy:"; do
  if echo "$FE_HEADERS" | grep -qi "$H"; then
    pass "Frontend has ${H%%:}"
  else
    fail "Frontend missing ${H%%:}"
  fi
done

if echo "$FE_HEADERS" | grep -qi "x-powered-by:"; then
  fail "Frontend exposes X-Powered-By (should be stripped by nginx)"
else
  pass "Frontend does not expose X-Powered-By"
fi

header "WebSocket endpoint"
if command -v node >/dev/null 2>&1; then
  if ACCESS_TOKEN="${ACCESS_TOKEN:-test}" WS_URL="$WS_URL" node "$ROOT_DIR/features/realtime/test-websocket.js" >/dev/null 2>&1; then
    if [[ -n "${ACCESS_TOKEN:-}" && "$ACCESS_TOKEN" != "test" ]]; then
      pass "WebSocket auth succeeded (${WS_URL})"
    else
      fail "WebSocket should reject invalid token (got success)"
    fi
  else
    if [[ -n "${ACCESS_TOKEN:-}" && "$ACCESS_TOKEN" != "test" ]]; then
      fail "WebSocket auth failed with real ACCESS_TOKEN"
    else
      pass "WebSocket reachable; invalid token rejected (${WS_URL})"
    fi
  fi
else
  fail "node not found — cannot test WebSocket"
fi

if [[ -n "${ACCESS_TOKEN:-}" && "$ACCESS_TOKEN" != "test" ]]; then
  header "WebSocket auth (ACCESS_TOKEN provided)"
  if ACCESS_TOKEN="$ACCESS_TOKEN" WS_URL="$WS_URL" node "$ROOT_DIR/features/realtime/test-websocket.js" >/dev/null 2>&1; then
    pass "Authenticated WebSocket connection:ready"
  else
    fail "Authenticated WebSocket did not reach connection:ready"
  fi
fi

if [[ "$ON_VPS" == true ]]; then
  header "VPS-only checks (localhost bind + nginx)"
  if ss -tlnp 2>/dev/null | grep -q '127.0.0.1:3001'; then
    pass "Frontend Docker bound to 127.0.0.1:3001"
  else
    fail "127.0.0.1:3001 not listening"
  fi

  if ss -tlnp 2>/dev/null | grep '0.0.0.0:3001' >/dev/null 2>&1 || ss -tlnp 2>/dev/null | grep '\[::\]:3001' >/dev/null 2>&1; then
    fail "Port 3001 still exposed on 0.0.0.0 or [::]"
  else
    pass "Port 3001 not exposed publicly"
  fi

  if ss -tlnp 2>/dev/null | grep -q '127.0.0.1:5000'; then
    pass "Backend Docker bound to 127.0.0.1:5000"
  else
    fail "127.0.0.1:5000 not listening"
  fi

  if [[ -f /etc/nginx/conf.d/cors-map.conf ]] && grep -q 'cors_origin' /etc/nginx/conf.d/cors-map.conf; then
    pass "nginx CORS map installed (/etc/nginx/conf.d/cors-map.conf)"
  else
    fail "nginx CORS map missing"
  fi

  if [[ -e /etc/nginx/sites-enabled/devqii.me.bak ]]; then
    fail "Duplicate nginx site devqii.me.bak still enabled"
  else
    pass "No devqii.me.bak in sites-enabled"
  fi

  if nginx -t >/dev/null 2>&1; then
    pass "nginx -t succeeds"
  else
    fail "nginx -t failed"
  fi

  if docker ps --format '{{.Names}}' | grep -q 'nexthire-backend'; then
    pass "Container running: nexthire-backend"
  else
    fail "Container not running: nexthire-backend"
  fi

  if docker ps --format '{{.Names}}' | grep -q 'nexthire-ui'; then
    pass "Container running: nexthire-ui"
  else
    fail "Container not running: nexthire-ui"
  fi
fi

echo ""
echo "Results: ${PASS} passed, ${FAIL} failed"
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
echo "All checks passed."
exit 0