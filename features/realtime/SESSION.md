# Session Handoff — 2026-06-29

**Full security + production detail:** `security/SESSION.md`

---

## Production

| Service | URL |
| --- | --- |
| Frontend | https://nexthire.devqii.me |
| API | https://devqii.me/api/v1 |
| WebSocket | wss://nexthire.devqii.me/ws |
| VPS | 143.198.86.248 — backend `/home/backend/nexthire`, frontend `/opt/nexthire-ui` |

---

## Commits (`websocket`)

| Repo | Latest |
| --- | --- |
| Backend | `6139126` — verify CSP report-only (24 production checks) |
| Frontend | `dc23f58` — Playwright CI, CSP report-only, nonce in proxy.ts |

---

## Security / realtime status

| Area | Status |
| --- | --- |
| WebSocket + notifications | Done on `websocket` branch |
| OAuth (no `?token=` URL) | Done — refresh cookie handoff |
| CSP + COOP + CORP + report-uri | Live on production |
| CSP report-only (telemetry) | Live — no `unsafe-inline` in report-only |
| Playwright security CI | `.github/workflows/security.yml` — 3 tests |
| `verify-production.sh` | **24/24 passed** (remote) |

---

## Quick verify

```bash
bash features/realtime/verify-production.sh
ACCESS_TOKEN=<jwt> bash features/realtime/verify-production.sh   # + WS auth
node features/realtime/e2e-websocket.js                           # 12 E2E checks
```

```bash
# Frontend (separate repo)
cd C:\Users\devqii\Downloads\job-portal-ui
npm run test:security
```

---

## Local paths

```
Backend:  C:\job-portal\backend
Frontend: C:\Users\devqii\Downloads\job-portal-ui
```

---

## Next

See `security/SESSION.md` → **Deferred / next steps** (CSP reports, enforcing nonce, OAuth click-test, OWASP Phase 3 XSS).