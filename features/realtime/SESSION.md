# Session Handoff — 2026-06-28

Saved state after production deploy + WebSocket fixes on the `websocket` branch.

---

## Production URLs

| Service | URL |
| --- | --- |
| Frontend | https://nexthire.devqii.me |
| API | https://devqii.me/api/v1 |
| WebSocket (browser) | **wss://nexthire.devqii.me/ws** (same-origin, nginx → backend :5000) |
| WebSocket (smoke test) | `WS_URL=wss://nexthire.devqii.me/ws` or `wss://devqii.me/ws` |
| VPS | 143.198.86.248 |

**Do not open `wss://` in the browser address bar** — it is not a webpage (`ERR_UNKNOWN_URL_SCHEME`). WS is only used via `new WebSocket()` in JavaScript.

---

## Repos & branches (production)

| Repo | Remote | Branch | Latest commits (session end) |
| --- | --- | --- | --- |
| Backend | `Devvfong/backend-job-portal` | `websocket` | `ed9a51e` auth cookie fix |
| Frontend | `Devvfong/job-portal-ui` | `websocket` | `f062ea5` same-origin WS + nginx |

**`main` is not used for production deploy.** Push to `websocket` → GitHub Actions auto-deploy.

---

## What was fixed this session

### Deploy
- Auto-deploy on `websocket` only (both repos)
- `git reset --hard origin/websocket` on VPS before deploy
- Backend: `prisma migrate deploy` on container start, `--no-cache` docker build
- Frontend: `chmod +x deploy.sh`, production env defaults in workflow

### Production WebSocket
1. **Refresh cookie** — `SameSite=None; Secure` in production (cross-origin: nexthire → devqii API)
2. **Same-origin WS** — browser connects to `wss://nexthire.devqii.me/ws`, nginx proxies to `127.0.0.1:5000`
3. **RealtimeProvider** — reconnects when access token changes
4. **Job events** — `job_seeker` role read from JWT if `/auth/me` not loaded yet
5. **Local dev unchanged** — WS still uses `ws://localhost:5000/ws`

### Features shipped
- Job `startDate` / `endDate` + migration
- Live job create / close / reopen / delete on seeker UI
- Company jobs card layout, responsive NotificationBell + Footer

---

## Verify production

```bash
# 1. Smoke test (any valid access token)
WS_URL=wss://nexthire.devqii.me/ws ACCESS_TOKEN=<token> node features/realtime/test-websocket.js
# Expect: connection:ready then exit 0

# 2. Manual UI
# - Log out + log in again at https://nexthire.devqii.me (refreshes jwt cookie)
# - job_seeker on /jobs + company creates job in another tab → list updates live
# - DevTools → Network → WS → wss://nexthire.devqii.me/ws → connection:ready
```

---

## Local paths

```
Backend:  C:\job-portal\backend
Frontend: C:\Users\devqii\Downloads\job-portal-ui
```

---

## Still not done

- Postgres `Notification` table (computed feed only)
- DB read/unread state
- Multi-server WS (Redis pub/sub)
- CI E2E tests
- WS rate limiting

---

## Key files changed (production WS)

**Backend:** `src/utils/generateToken.js`, `src/controllers/auth.controller.js`, `deploy.sh`, `.github/workflows/deploy.yml`

**Frontend:** `lib/realtime.ts`, `lib/realtime-client.ts`, `components/layout/RealtimeProvider.tsx`, `hooks/useRealtimeJobEvents.ts`, `deploy/nginx-nexthire-ui.conf`, `deploy/setup-nginx.sh`, `deploy.sh`