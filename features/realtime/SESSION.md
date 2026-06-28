# Session Handoff — 2026-06-28

Production + security session. **Full detail:** `security/SESSION.md`

---

## Production URLs

| Service | URL |
| --- | --- |
| Frontend | https://nexthire.devqii.me |
| API | https://devqii.me/api/v1 |
| WebSocket | **wss://nexthire.devqii.me/ws** |
| VPS | 143.198.86.248 |

---

## Repos (websocket branch)

| Repo | Latest commit |
| --- | --- |
| Backend `Devvfong/backend-job-portal` | `be39367` |
| Frontend `Devvfong/job-portal-ui` | `536d516` |

VPS backend path: `/home/backend/nexthire` (not `job-portal` alone).

---

## Verify

```bash
npm run verify:production
npm run verify:production:vps   # on VPS → 18 checks
```

---

## Security testing

- Playbook: `security/Web Security Testing.md`
- Phase 1 recon: `security/recon-report.json` (104 endpoints)
- Phase 6 headers: `security/headers-audit.json`
- Next: Phase 2 injection (needs test accounts for phases 4–5)

---

## Local paths

```
Backend:  C:\job-portal\backend
Frontend: C:\Users\devqii\Downloads\job-portal-ui
```