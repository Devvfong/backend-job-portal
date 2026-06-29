# Session Handoff — 2026-06-29

**Full detail:** `security/SESSION.md`

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
| Backend | `c2af4cc` — Postgres `Notification` table + read/delete API |
| Frontend | `c41ee75` — notification read/delete via API |

---

## Realtime + notifications status

| Feature | Status |
| --- | --- |
| WebSocket `/ws` + first-message auth | Done |
| Shared builders in `notification.service.js` | Done |
| Emit after DB success | Done |
| **Postgres `Notification` table** | **Done** — migration applied to Neon |
| HTTP `GET /notifications` | Reads from DB (not rebuilt from applications) |
| Read/delete API | `PATCH read-all`, `PATCH :id/read`, `DELETE :id` |
| Frontend read state | API (not localStorage) |
| Multi-server Redis pub/sub | Not done |

---

## Quick verify

```bash
bash features/realtime/verify-production.sh
ACCESS_TOKEN=<jwt> bash features/realtime/verify-production.sh
node features/realtime/e2e-websocket.js
```

```bash
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

See `security/SESSION.md` → test notifications live, optional backfill, CSP/OAuth follow-ups.