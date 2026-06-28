# Session Handoff — 2026-06-28 (Security + Production)

Saved state after production hardening, Cloudflare nginx, Phase 1 security recon.

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
| Backend | `C:\job-portal\backend` | `Devvfong/backend-job-portal` | `websocket` | `be39367` |
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

**Docker (localhost only):**

- `nexthire-ui` → `127.0.0.1:3001`
- `nexthire-backend` → `127.0.0.1:5000`
- `nexthire-redis` → internal

---

## Security work completed

### nginx / headers
- Frontend: HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy
- API: helmet CSP + headers; CORS whitelist via `$cors_origin` (blocked origins get no CORS headers)
- Cloudflare real-IP trust (`CF-Connecting-IP`) for accurate rate limits
- `X-Powered-By: Next.js` removed (nginx `proxy_hide_header` + `poweredByHeader: false`)
- Dotfile deny (`/.env`, `/.git`, etc.)
- API rate limit: nginx `10 req/s` + burst 20

### Deploy / DB
- `DIRECT_URL` GitHub secret set (Neon non-pooler for Prisma migrate)
- `prisma/schema.prisma` → `directUrl = env("DIRECT_URL")`
- `deploy.sh` → ensures `DIRECT_URL` in `.env`, runs `nginx/install-cloudflare-nginx.sh`
- Workflow path fixed: `cd /home/backend/nexthire`
- Frontend `deploy.sh` → `--force-recreate` for localhost port bind

### Verification
```bash
npm run verify:production          # 11 checks (local)
npm run verify:production:vps      # 18 checks (on VPS)
```

Last known: **18/18 passed** on VPS.

---

## Security testing playbook (`security/`)

| File | Purpose |
| --- | --- |
| `Web Security Testing.md` | OWASP 7-phase agent guide |
| `recon-report.json` | **Phase 1 complete** — 104 endpoints mapped |
| `headers-audit.json` | Phase 6 headers audit |
| `SESSION.md` | This handoff |

### Phase status

| Phase | Status | Output |
| --- | --- | --- |
| 1 Reconnaissance | **Done** | `recon-report.json` |
| 2 Injection | **Done** (77 probes, 0 confirmed) | `injection-findings.json` |
| 3 XSS | Not started | `xss-findings.json` |
| 4 Auth | Not started | `auth-findings.json` |
| 5 Access control | Not started | `access-control-findings.json` |
| 6 Headers | **Done** | `headers-audit.json` |
| 7 Report | Waiting on 2–5 | final report |

### Phase 3 next
- XSS on reflection points from Phase 2 (frontend `/jobs?q=`, API error messages)
- Run: `node security/run-injection-phase2.js` to re-test injection

### Phase 4+ prerequisites
- Test accounts: `job_seeker`, `company_admin` (optional `super_admin`)
- User approval before brute-force (Phase 4 gate)
- Scope: production API + frontend only (no destructive scans)

---

## Key backend files (security)

```
nginx/cloudflare-real-ip.conf
nginx/cors-map.conf
nginx/install-cloudflare-nginx.sh
nginx/ensure-direct-url.py
features/realtime/verify-production.sh
prisma/schema.prisma          # directUrl
deploy.sh
.github/workflows/deploy.yml  # /home/backend/nexthire
```

## Key frontend files (security)

```
deploy/nginx-nexthire-ui.conf   # security headers + proxy_hide_header
next.config.mjs                 # poweredByHeader: false
deploy.sh                       # --force-recreate
```

---

## GitHub secrets (backend repo)

Includes: `DATABASE_URL`, **`DIRECT_URL`**, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`, `SSH_PRIVATE_KEY`, etc.

---

## Optional / not done

- Frontend CSP header
- Postgres `Notification` table + DB read/unread
- Multi-server WS (Redis pub/sub)
- CI E2E security tests
- Phases 2–5 pentest execution
- Commit `security/` folder to git (currently local/untracked)

---

## Quick health check

```bash
# Local
cd C:\job-portal\backend && npm run verify:production

# VPS
ssh root@143.198.86.248
cd /home/backend/nexthire && bash features/realtime/verify-production.sh --vps
docker ps -a
```

---

## Resume next session

1. Read `security/recon-report.json` for endpoint map
2. Run **Phase 2 injection** on `injectionTestTargets.priorityParameters`
3. Or commit/push `security/` folder if you want it in the repo