# NextHire WebSocket Realtime — Final Integration Guide

This document is the combined, finalized reference for realtime notifications in the NextHire project, merging all integration guides and agent handoff notes.

**Read this file before changing any WebSocket or notification code.**

---

## 1. Quick Start & Status

**Status: DONE (websocket branch)**
- Live E2E: **12/12 passed**. Pushed to remote. No merge to `main` yet.
- Backend: `websocket` branch (`80cbf3e`+)
- Frontend (separate repo): `websocket` branch (`b05ac92`+)

### Run locally
```bash
# Terminal 1 — Backend
cd C:\job-portal\backend
git checkout websocket
npm run dev

# Terminal 2 — Frontend
cd C:\Users\devqii\Downloads\job-portal-ui
git checkout websocket
npm run dev
```

---

## 2. What Was Built (Realtime Events)

HTTP `GET /api/v1/notifications` remains as the fallback and initial loader. WebSocket adds **live pushes** for the following events:

| Event | When | Who receives |
| --- | --- | --- |
| `notification:new` | Seeker applies to a job | Seeker, Company Admin, Super Admin |
| `notification:new` | Application status changes | Seeker (deduped by `applicationId`) |
| `notification:new` | New open job is created | All connected `job_seeker` roles |
| `notification:remove` | Seeker withdraws application | Seeker who withdrew |

---

## 3. Architecture & Golden Rules

```text
notification.service.js  → Build single payload (HTTP + WS share builders)
controllers              → Emit ONLY after DB success
realtime/websocket.js    → Transport only (Auth, client maps, broadcast)
```

### Golden Rules for Changes
1. **Payloads:** Build every notification payload in `notification.service.js` only.
2. **Emit Timing:** Emit only **after** the database action succeeds.
3. **No Business Logic:** Never put Prisma or business logic inside `websocket.js`.
4. **Fallback:** Keep HTTP `/notifications` fallback functional.
5. **Update Docs:** Update this file when behavior changes.

---

## 4. Auth: Access Token vs Refresh Token (CRITICAL)

**Two tokens, two strictly separated jobs:**

| Token | Expires | Stored where | Used for |
| --- | --- | --- | --- |
| **Access token** | 5 mins | `localStorage`, `token` cookie | API routes, **WebSocket auth frame** |
| **Refresh token** | 1 day | httpOnly `jwt` cookie | `POST /api/v1/auth/refresh` only |

**WebSocket Auth Detail:**
- WebSocket authenticates using the **Access Token** ONLY. It requires the `id` and `role` claims.
- The refresh token has no `role` and WebSocket **must reject it**.
- Client flow: Open `ws://host/ws` (no token in URL) → Send `{ event: "auth", payload: { token } }` → Wait for `connection:ready`.

---

## 5. File Map

### Backend (This Repo)
| File | Role |
| --- | --- |
| `src/realtime/websocket.js` | WS server, auth, client maps, broadcast |
| `src/services/notification.service.js` | Payload builders + HTTP feed |
| `src/controllers/application.controller.js` | Emit on apply/status/withdraw |
| `src/controllers/job.controller.js` | Emit on open job create |
| `nginx/default.conf` | `/ws` upgrade headers |

### Frontend (Separate Repo)
| File | Role |
| --- | --- |
| `lib/realtime.ts` | WS URL, dedupe helpers, token refresh |
| `lib/auth-session.ts` | `persistAccessToken`, `clearAccessSession` |
| `hooks/useRealtimeNotifications.ts` | Connect, auth frame, reconnect |
| `components/shared/NotificationBell.tsx` | HTTP load + realtime merge |

---

## 6. How To Add A New Realtime Event

Do these steps in order:
1. Add payload builder in `notification.service.js`.
2. Make sure the service returns the fields that builder needs.
3. Emit from the controller after the DB action succeeds.
4. Add event name to `REALTIME_EVENTS` (backend + frontend) if new.
5. Handle the event in `useRealtimeNotifications.ts`.
6. Update UI state in the consuming component.
7. Update this guide.

---

## 7. Testing

**Backend Syntax:**
```bash
node --check src/server.js
node --check src/realtime/websocket.js
node --check src/services/notification.service.js
```

**WebSocket Smoke & Live E2E Tests:**
```bash
# Terminal 1 — start stable backend (use node, not nodemon)
node src/server.js

# Terminal 2 — smoke auth
ACCESS_TOKEN=<valid_access_token> node features/realtime/test-websocket.js

# Terminal 2 — full E2E (Expect 12 passed)
node features/realtime/e2e-websocket.js
```

---

## 8. Not in Scope Yet (Future Work)

- Postgres `Notification` table (notifications are currently computed, not stored).
- DB read/unread state (read state is frontend browser-only today).
- Redis for multi-instance WS (in-memory client map does not scale horizontally).
- Production deploy verification.
- Automated CI integration tests (only manual E2E script exists).
- Rate limiting on `/ws` (optional hardening).
