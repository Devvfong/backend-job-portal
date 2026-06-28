# Session Handoff — 2026-06-28 (Security + Production)

Saved state after production hardening, OWASP Phase 1–2 security testing.

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
| Backend | `C:\job-portal\backend` | `Devvfong/backend-job-portal` | `websocket` | `605be86` |
| Frontend | `C:\Users\devqii\Downloads\job-portal-ui` | `Devvfong/job-portal-ui` | `websocket` | `536d516` |

**Production deploys from `websocket` only** (not `main`). Push → GitHub Actions → VPS.

---

## VPS layout

| What | Path |
| --- | --- |
| Backend git + deploy | `/home/backend/nexthire` |
| Symlink (legacy) | `/home/backend/job-portal` → `nexthire` |
| Frontend git + deploy | `/opt/nexthire-ui` |
| nginx frontend | `/etc/nginx/sites-available/nexthire-ui` |
| nginx API | `/etc/nginx/sites-available/devqii.me` |
| CORS map | `/etc/nginx/conf.d/cors-map.conf` |
| Cloudflare real-IP | `/etc/nginx/conf.d/cloudflare-real-ip.conf` |

**Docker (localhost only):** `nexthire-ui` → `127.0.0.1:3001`, `nexthire-backend` → `127.0.0.1:5000`

---

## Security testing (`security/`)

| File | Purpose |
| --- | --- |
| `Web Security Testing.md` | OWASP 7-phase playbook |
| `recon-report.json` | Phase 1 — 104 endpoints |
| `injection-findings.json` | Phase 2 — 77 probes, **0 confirmed** |
| `headers-audit.json` | Phase 6 headers |
| `run-injection-phase2.js` | Re-run Phase 2 script |
| `SESSION.md` | This handoff |

### Phase status

| Phase | Status | Output |
| --- | --- | --- |
| 1 Reconnaissance | **Done** | `recon-report.json` |
| 2 Injection | **Done** | `injection-findings.json` |
| 3 XSS | **Next** | `xss-findings.json` |
| 4 Auth | Not started | `auth-findings.json` |
| 5 Access control | Not started | `access-control-findings.json` |
| 6 Headers | **Done** | `headers-audit.json` |
| 7 Report | Waiting on 3–5 | final report |

### Phase 2 summary
- SQLi, NoSQL, LDAP, path traversal on public API + frontend `/jobs?q=`
- Code review: no raw SQL in `src/`, Prisma parameterized queries
- **Gate passed** — proceed to Phase 3
- Not tested without auth: job create, file uploads, application patch

### Phase 3 targets (XSS)
- Reflected: `https://nexthire.devqii.me/jobs?q=`, `jobType=`
- Stored: job title/description, company profile, user bio (needs tokens)
- DOM: URL hash/fragment on frontend

### Phase 4–5 prerequisites
- Test accounts: `job_seeker`, `company_admin` (optional `super_admin`)
- User approval before brute-force (Phase 4 gate)

---

## Production security (done)

- CORS whitelist, Cloudflare real-IP, security headers, `X-Powered-By` stripped
- `DIRECT_URL` + Prisma `directUrl` for Neon migrations
- `npm run verify:production` (11 checks) / `--vps` (18 checks)

---

## Commands

```bash
# Health check
npm run verify:production

# Re-run Phase 2 injection
node security/run-injection-phase2.js

# VPS verify
ssh root@143.198.86.248
cd /home/backend/nexthire && bash features/realtime/verify-production.sh --vps
```

---

## Resume next session

1. Open `security/SESSION.md` (this file)
2. Run **Phase 3 XSS** → output `xss-findings.json`
3. Provide test accounts before Phase 4–5