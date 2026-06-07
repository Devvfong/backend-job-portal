---
name: realtime-websocket
description: >
  Job Portal realtime WebSocket notifications. Use when working on /ws, live
  notifications, notification.service.js, useRealtimeNotifications, NotificationBell,
  access vs refresh token auth, or features/realtime. Triggers: websocket, realtime,
  notification push, connection:ready, notification:new, notification:remove.
---

# Realtime WebSocket — Job Portal

Read `features/realtime/WEBSOCKET_INTEGRATION_GUIDE.md` first. Then `AGENTS.md` for repo layout.

## Two repos

| Repo | Path | Branch |
| --- | --- | --- |
| Backend | `C:\job-portal\backend` | `websocket` |
| Frontend | `C:\Users\devqii\Downloads\job-portal-ui` | `websocket` |

## Architecture (do not break)

```text
notification.service.js  → single payload builder (HTTP + WS)
controllers              → emit AFTER DB success
realtime/websocket.js    → transport only (no Prisma, no payload building)
```

## Auth rule

- WebSocket: **access token** with `id` + `role` in JWT
- Refresh token (`jwt` cookie): `POST /auth/refresh` only — reject on `/ws`

Client flow: open `ws://host/ws` → send `{ event: "auth", payload: { token } }` → wait for `connection:ready`.

## Events

- `notification:new` — apply, status change, new open job
- `notification:remove` — withdraw (seeker only)

## Before finishing

```bash
# Backend (stable server for E2E)
node src/server.js
node features/realtime/e2e-websocket.js   # expect 12 passed

# Frontend
npm run lint && npx tsc --noEmit && npm run build
```

## Adding a new realtime event

1. Builder in `notification.service.js`
2. Service returns required fields
3. Emit from controller after DB success
4. Handle in `useRealtimeNotifications.ts` + UI
5. Update `WEBSOCKET_INTEGRATION_GUIDE.md`

## Not implemented yet

Postgres notification table, DB read state, Redis multi-instance WS, CI integration tests.