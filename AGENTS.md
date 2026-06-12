# AGENTS.md — NextHire Backend

Instructions for AI agents working on this repo. Read this before changing auth, notifications, or WebSocket code.

---

## Repositories

| Project | Local path | Branch | Remote |
| --- | --- | --- | --- |
| Backend | `C:\job-portal\backend` | `websocket` | `github.com/Devvfong/nexthire-backend` |
| Frontend | `C:\Users\devqii\Downloads\job-portal-ui` | `websocket` | `github.com/Devvfong/nexthire-ui` |

Frontend is a **separate repo**. It is not inside `C:\job-portal`.

---

## Commands

```bash
npm run dev          # nodemon — restarts on file changes
node src/server.js   # stable server (use for WebSocket E2E tests)
npm run build        # prisma generate
node --check src/realtime/websocket.js
```

Test scripts:

```bash
ACCESS_TOKEN=<token> node features/realtime/test-websocket.js
node features/realtime/e2e-websocket.js   # full live E2E (12 checks)
```

---

## Realtime / WebSocket Architecture

**Pattern:** HTTP `GET /api/v1/notifications` is the fallback. WebSocket pushes live events.

```text
notification.service.js     → build every payload (HTTP + WS share builders)
application.controller.js   → emit after DB success (apply, status, withdraw)
job.controller.js           → emit new job to job_seeker role
realtime/websocket.js         → transport only (auth, client maps, broadcast)
```

### Golden rules

1. Build notification payloads only in `notification.service.js`.
2. Emit only **after** the database mutation succeeds.
3. Never put Prisma or business logic in `websocket.js`.
4. WebSocket auth uses the **access token** only — never the refresh token.

### WebSocket path

`ws://localhost:5000/ws` (production: `wss://<api-domain>/ws`)

Preferred auth: connect with no token in URL, then send:

```json
{ "event": "auth", "payload": { "token": "<access_token>" } }
```

Server replies with `connection:ready`. Rejects close with code `1008`.

### Realtime events

| Event | When | Who receives |
| --- | --- | --- |
| `notification:new` | apply | seeker, company, super_admin |
| `notification:new` | status update | seeker |
| `notification:new` | open job created | connected `job_seeker` |
| `notification:remove` | withdraw | seeker who withdrew |

### Key files

```text
src/server.js                          initRealtime(server)
src/realtime/websocket.js
src/services/notification.service.js
src/controllers/application.controller.js
src/controllers/job.controller.js
src/controllers/notification.controller.js
nginx/default.conf                     /ws upgrade proxy
features/realtime/WEBSOCKET_INTEGRATION_GUIDE.md
features/realtime/test-websocket.js
features/realtime/e2e-websocket.js
```

---

## Auth: Access vs Refresh Token

| Token | Lifetime | Storage | Use |
| --- | --- | --- | --- |
| Access | 5 min | `localStorage`, `token` cookie, Bearer header | API + WebSocket |
| Refresh | 1 day | httpOnly `jwt` cookie (backend only) | `POST /api/v1/auth/refresh` |

Access token JWT payload must include `id` and `role`. Refresh token has no `role` — WebSocket must reject it.

Frontend files (separate repo): `lib/auth-session.ts`, `lib/realtime.ts`, `hooks/useRealtimeNotifications.ts`, `components/shared/NotificationBell.tsx`.

---

## API Routes (realtime-related)

| Method | Route | Role |
| --- | --- | --- |
| GET | `/api/v1/notifications` | any logged-in user |
| POST | `/api/v1/applications/job/:id/apply` | `job_seeker` |
| PATCH | `/api/v1/applications/:id/status` | `company_admin` |
| DELETE | `/api/v1/applications/:id` | `job_seeker` (own app) |
| POST | `/api/v1/jobs/create` | `company_admin` |

Numeric IDs work on routes with `decryptMiddleware` — encrypted IDs are optional.

---

## Environment

```env
DATABASE_URL=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
SESSION_SECRET=...
CORS_ORIGINS=http://localhost:3000
```

Frontend needs `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`.

---

## Testing Checklist

Before marking realtime work done:

1. `node --check` on changed JS files
2. `ACCESS_TOKEN=... node features/realtime/test-websocket.js` → `connection:ready`
3. `node features/realtime/e2e-websocket.js` → 12 passed (use `node src/server.js`, not nodemon)
4. Frontend: `npm run lint`, `npx tsc --noEmit`, `npm run build`

---

## Done vs Not Done

### Done (websocket branch)

- WebSocket at `/ws` with first-message auth
- Shared notification payloads
- Apply, status, withdraw, new job, super_admin emits
- Frontend realtime hook + NotificationBell
- Access/refresh token separation
- Nginx `/ws` proxy
- Integration guide + E2E script (12/12 passed live)

### Not done yet

- Postgres `Notification` table
- DB read/unread state (localStorage only today)
- Multi-server WebSocket (Redis pub/sub)
- Automated CI integration tests
- WS rate limiting

---

## Do Not Change Lightly

- Access-token-only WebSocket auth
- `token` vs `jwt` cookie separation
- Shared builders in `notification.service.js`
- Notification ID formats (`app-pending-{id}`, `new-job-{id}`, etc.)
- `applicationId` on application-related payloads
- HTTP `/api/v1/notifications` fallback
- Emit-after-success pattern

---

## MCP & Docs

- **Full guide:** `features/realtime/WEBSOCKET_INTEGRATION_GUIDE.md` — read this first for WebSocket work
- **MCP:** `.mcp.json` — Neon Postgres + filesystem access to `features/realtime`
- **Skill:** `.grok/skills/realtime-websocket/SKILL.md` — auto-invoked for realtime tasks

---

## Commit Style

```text
feat(realtime): add notification emit on job create
fix(realtime): dedupe status notifications by applicationId
docs(realtime): update integration guide
test(realtime): add e2e websocket script
```

Push to `websocket` branch unless the user asks to merge.