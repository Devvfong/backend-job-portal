# Session Handoff — 2026-06-29 (Security + Notifications + OpenAPI)

Saved state after CSP/OAuth hardening, Playwright CI, Postgres `Notification` table, and OpenAPI sync.

---

## Production URLs

| Service | URL |
| --- | --- |
| Frontend | https://nexthire.devqii.me |
| API | https://devqii.me/api/v1 |
| WebSocket | **wss://nexthire.devqii.me/ws** (same-origin → nginx → `127.0.0.1:5000`) |
| VPS | `143.198.86.248` (SSH `root@`) |

---

## Repos & branches

| Repo | Path | Remote | Branch | Latest commit |
| --- | --- | --- | --- | --- |
| Backend | `C:\job-portal\backend` | `Devvfong/backend-job-portal` | `websocket` | `c2af4cc` |
| Frontend | `C:\Users\devqii\Downloads\job-portal-ui` | `Devvfong/job-portal-ui` | `websocket` | `c41ee75` |

**Production deploys from `websocket` only** (not `main`). Push → GitHub Actions → VPS.

---

## Latest: Postgres notifications (done)

### Database
- **Table:** `Notification` — composite PK `(userId, id)`
- **IDs preserved:** `app-pending-{id}`, `new-job-{id}`, `new-applicant-{id}`, etc.
- **Migration:** `20260629130000_add_notifications_table` (applied to Neon)

### Backend `c2af4cc`
- Persist on: apply, status update, withdraw, new/close/reopen/delete job, company suspend/warn
- `notifyUser` / `notifyCompany` / `notifyRole` → DB write, then WebSocket emit
- **Routes:**
  - `GET /api/v1/notifications`
  - `PATCH /api/v1/notifications/read-all`
  - `PATCH /api/v1/notifications/:id/read`
  - `DELETE /api/v1/notifications/:id`

### Frontend `c41ee75`
- Read/delete via API (no more `localStorage` for read state)
- `lib/notification-read.ts` → PATCH/DELETE endpoints

### Note
- No backfill — existing users start empty; new events populate the table
- Optional: one-time backfill script from recent applications

---

## Security & OAuth (done earlier)

| Area | Commits | Status |
|------|---------|--------|
| OAuth no `?token=` | `d887920`, `415f516` | Live |
| CSP + COOP + CORP + report-uri | `9fac024`–`668f90c` | Live |
| CSP report-only telemetry | `d21e25b` | Live |
| Playwright CI (3 tests) | `d21e25b` | `.github/workflows/security.yml` |
| Self-hosted Leaflet | `668f90c` | No `unpkg.com` in CSP |
| Nonce via `proxy.ts` | `dc23f58` | Not `middleware.ts` |
| `verify-production.sh` | `6139126` | **24/24** checks |
| OpenAPI sync | `410d34d` | `openapi.json` + `npm run export:openapi` |

---

## RLS decision (documented, not implemented)

- **Recommendation:** Do **not** enable Neon RLS now — app uses single Prisma role; auth is in Express middleware
- Revisit if adding direct DB client access or multi-service architecture

---

## Key files

| Area | Path |
| --- | --- |
| Prisma model | `prisma/schema.prisma` → `Notification` |
| Notification service | `src/services/notification.service.js` |
| Notification routes | `src/routes/notification.routes.js` |
| WebSocket transport | `src/realtime/websocket.js` |
| OpenAPI source | `src/utils/openapi.js` |
| Static OpenAPI export | `openapi.json`, `npm run export:openapi` |
| CSP builders | `job-portal-ui/lib/security-headers.mjs` |
| Notification bell UI | `job-portal-ui/components/shared/NotificationBell.tsx` |
| Production verify | `features/realtime/verify-production.sh` |

---

## Verification

```bash
# Production security (24 checks)
bash features/realtime/verify-production.sh

# Playwright security (3 checks)
cd C:\Users\devqii\Downloads\job-portal-ui
npm run test:security

# WebSocket E2E (12 checks, needs running server + tokens)
node features/realtime/e2e-websocket.js

# Regenerate OpenAPI
npm run export:openapi
```

---

## Deferred / next steps

| Priority | Task |
| --- | --- |
| 1 | **Test notifications live** — apply to a job; confirm bell + Neon `Notification` rows |
| 2 | **Optional backfill** — script recent applications into `Notification` |
| 3 | **Watch CSP reports** — `docker logs nexthire-ui \| grep csp-report` |
| 4 | **Enforcing nonce CSP** — drop `unsafe-inline` when violations are low |
| 5 | **OAuth click-test** — GitHub/LinkedIn login end-to-end |
| 6 | **OWASP Phase 3 XSS** — `security/Web Security Testing.md` |
| 7 | **Multi-server WS** — Redis pub/sub (not done) |

---

## Resume next session

1. Open this file: `security/SESSION.md`
2. Confirm deploy: `bash features/realtime/verify-production.sh`
3. Test notification flow (apply → bell → DB row)
4. Pick from **Deferred** above