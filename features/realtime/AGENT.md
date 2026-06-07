# AGENT.md — Realtime WebSocket Handoff

Focused handoff for the next agent. Full detail: `WEBSOCKET_INTEGRATION_GUIDE.md`.

---

## Status: DONE (websocket branch)

Live E2E: **12/12 passed**. Pushed to remote. No merge to `main` yet.

| Repo | Branch | Latest |
| --- | --- | --- |
| Backend | `websocket` | `80cbf3e`+ |
| Frontend | `websocket` | `b05ac92` |

---

## What was built

HTTP notifications stay. WebSocket adds live pushes for:

- seeker applies → seeker + company + super_admin notified
- status update → seeker notified (deduped by `applicationId`)
- withdraw → seeker gets `notification:remove`
- new open job → all connected seekers notified

---

## File map

### Backend

| File | Role |
| --- | --- |
| `src/realtime/websocket.js` | WS server, auth, client maps, broadcast |
| `src/services/notification.service.js` | Payload builders + HTTP feed |
| `src/controllers/application.controller.js` | Emit on apply/status/withdraw |
| `src/controllers/job.controller.js` | Emit on open job create |
| `nginx/default.conf` | `/ws` upgrade headers |

### Frontend (separate repo)

| File | Role |
| --- | --- |
| `lib/realtime.ts` | WS URL, dedupe helpers, token refresh |
| `lib/auth-session.ts` | `persistAccessToken`, `clearAccessSession` |
| `hooks/useRealtimeNotifications.ts` | Connect, auth frame, reconnect |
| `components/shared/NotificationBell.tsx` | HTTP load + realtime merge |

---

## Auth (critical)

| Token | Use |
| --- | --- |
| Access (5 min) | API Bearer + WS auth frame |
| Refresh (1 day, httpOnly `jwt`) | `/auth/refresh` only |

Frontend must never write access token to `jwt` cookie.

---

## Test commands

```bash
# Terminal 1
cd C:\job-portal\backend && node src/server.js

# Terminal 2 — smoke
ACCESS_TOKEN=<access_token> node features/realtime/test-websocket.js

# Terminal 2 — full E2E
node features/realtime/e2e-websocket.js
```

---

## Rules for changes

1. Payloads only in `notification.service.js`
2. Emit after DB success
3. No business logic in `websocket.js`
4. Keep HTTP `/notifications` fallback
5. Update this file + `WEBSOCKET_INTEGRATION_GUIDE.md` when behavior changes

---

## Not in scope yet

- Postgres notification table
- DB read/unread
- Redis for multi-instance WS
- Production deploy verification