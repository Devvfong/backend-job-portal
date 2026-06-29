# Session Handoff — 2026-06-29 (Frontend Security + OAuth)

Saved state after CSP hardening, OAuth handoff, Playwright CI, and production verification.

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
| Backend | `C:\job-portal\backend` | `Devvfong/backend-job-portal` | `websocket` | `6139126` |
| Frontend | `C:\Users\devqii\Downloads\job-portal-ui` | `Devvfong/job-portal-ui` | `websocket` | `dc23f58` |

**Production deploys from `websocket` only** (not `main`). Push → GitHub Actions → VPS.

---

## What was completed this session

### OAuth (no token in URL)
- **Backend** `d887920`: GitHub/LinkedIn callbacks set `jwt` refresh cookie only; redirect to `/auth/callback` without `?token=`
- **Frontend** `415f516`: `OAuthCallbackClient` exchanges cookie via `POST /auth/refresh` + `credentials: 'include'`, then `/auth/me`

### Security headers
- **Frontend** `9fac024`, `5a8429d`: CSP, COOP, CORP; nginx dedupes duplicate headers from Next
- **Frontend** `415f516`: `POST /api/csp-report` + `report-uri` in enforcing CSP
- **Frontend** `668f90c`: Self-hosted Leaflet (npm bundle); removed `unpkg.com` from CSP
- **Frontend** `d21e25b`: `Content-Security-Policy-Report-Only` (no `unsafe-inline`) for violation telemetry
- **Frontend** `dc23f58`: Per-request nonce via `proxy.ts` (not `middleware.ts` — Next.js 16 conflict)

### Other hardening
- `rel="noopener noreferrer"` on external `_blank` links
- `window.open(..., 'noopener,noreferrer')` on admin API docs handoff
- Company dashboard animations moved from inline `<style>` → `globals.css`
- Async `JsonLd` reads `x-nonce` from `proxy.ts` for JSON-LD scripts

### CI & verify
- **Frontend** `d21e25b`: Playwright `tests/security-headers.spec.ts` + `.github/workflows/security.yml`
- **Backend** `39868ef` → `6139126`: `features/realtime/verify-production.sh` now **24 checks** (was 11)

---

## Production CSP (live)

**Enforcing** (`Content-Security-Policy`):
```
script-src 'self' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
report-uri https://nexthire.devqii.me/api/csp-report
```
No `unpkg.com`.

**Report-only** (`Content-Security-Policy-Report-Only`):
```
script-src 'self'
style-src 'self'
```
Violations POST to `/api/csp-report` (logged as `[csp-report]` in container logs). Site still works — report-only does not block.

---

## Verification (all passing)

```bash
# Backend repo — remote checks (24 passed)
bash features/realtime/verify-production.sh

# Frontend repo — Playwright (3 passed)
cd C:\Users\devqii\Downloads\job-portal-ui
npm run test:security
```

Last verified: **2026-06-29** — Playwright 3/3, verify-production 24/24.

---

## Key files

| Area | Path |
| --- | --- |
| CSP builders | `job-portal-ui/lib/security-headers.mjs` |
| CSP report API | `job-portal-ui/app/api/csp-report/route.ts` |
| OAuth callback UI | `job-portal-ui/components/forms/OAuthCallbackClient.tsx` |
| OAuth routes | `backend/src/routes/github.routes.js`, `linkedin.routes.js` |
| Nonce + auth proxy | `job-portal-ui/proxy.ts` |
| nginx CSP | `job-portal-ui/deploy/nginx-nexthire-ui.conf`, `setup-nginx.sh` |
| Playwright tests | `job-portal-ui/tests/security-headers.spec.ts` |
| Production verify | `backend/features/realtime/verify-production.sh` |
| Security reference | `job-portal-ui/security/Frontend Security Coder.md` (not committed) |

---

## Deploy notes

- VPS frontend path: `/opt/nexthire-ui`
- Deploy runs `docker compose up --build` then `deploy/setup-nginx.sh`
- **Build takes 3–5+ minutes** — headers lag until Docker + nginx finish
- **Do not add `middleware.ts`** — Next.js 16 uses `proxy.ts` only; both files break the build

### Why deploy looked “stuck”
1. First push (`d21e25b`) failed build: `middleware.ts` + `proxy.ts` conflict
2. Fixed in `dc23f58` — nonce merged into `proxy.ts`
3. Tests run before deploy finished will fail until new image is live

---

## Not committed (intentional)

| Path | Reason |
| --- | --- |
| `job-portal-ui/next-env.d.ts` | Auto-generated local dev path |
| `job-portal-ui/security/` | Reference doc only |
| `job-portal-ui/test-results/` | Playwright artifacts |
| `backend/agent-tools/`, `k8s/` | Local/untracked |

---

## Deferred / next steps

| Priority | Task |
| --- | --- |
| 1 | **Watch CSP reports** — `docker logs nexthire-ui` for `[csp-report]`; identify remaining inline script/style violations |
| 2 | **Enforcing nonce CSP** — drop `unsafe-inline` once violations are near zero; extend `proxy.ts` to set nonce in enforcing CSP |
| 3 | **Chart inline styles** — `components/ui/chart.tsx` dynamic `<style>` still violates report-only policy |
| 4 | **OAuth live test** — click GitHub/LinkedIn login; confirm no `?token=` in URL and dashboard loads |
| 5 | **OWASP Phase 3 XSS** — `security/Web Security Testing.md`; output `xss-findings.json` |
| 6 | **Postgres Notification table** | Realtime branch backlog (see `Agents.md`) |

---

## Commands

```bash
# Production verify (24 checks)
cd C:\job-portal\backend
bash features/realtime/verify-production.sh

# Playwright security smoke
cd C:\Users\devqii\Downloads\job-portal-ui
npm run test:security

# Check live CSP headers
curl -sI https://nexthire.devqii.me | grep -i content-security

# VPS logs (CSP violations)
ssh root@143.198.86.248
docker logs nexthire-ui 2>&1 | grep csp-report | tail -20

# Re-run OWASP Phase 2 injection
cd C:\job-portal\backend
node security/run-injection-phase2.js
```

---

## Resume next session

1. Open this file: `security/SESSION.md`
2. Run `bash features/realtime/verify-production.sh` and `npm run test:security` to confirm still green
3. Pick next item from **Deferred** table above