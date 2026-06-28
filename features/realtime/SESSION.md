# Session Handoff — 2026-06-28

**Full security + production detail:** `security/SESSION.md`

---

## Production

| Service | URL |
| --- | --- |
| Frontend | https://nexthire.devqii.me |
| API | https://devqii.me/api/v1 |
| WebSocket | wss://nexthire.devqii.me/ws |
| VPS | 143.198.86.248 — backend `/home/backend/nexthire` |

---

## Commits (`websocket`)

| Repo | Latest |
| --- | --- |
| Backend | `605be86` — Phase 2 injection testing |
| Frontend | `536d516` |

---

## Security testing progress

| Phase | Status |
| --- | --- |
| 1 Recon | Done — `security/recon-report.json` |
| 2 Injection | Done — 77 probes, 0 vulns |
| 6 Headers | Done — `security/headers-audit.json` |
| **3 XSS** | **Next** |

```bash
node security/run-injection-phase2.js   # re-run Phase 2
npm run verify:production
```

---

## Local paths

```
Backend:  C:\job-portal\backend
Frontend: C:\Users\devqii\Downloads\job-portal-ui
```