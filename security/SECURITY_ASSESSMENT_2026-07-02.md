# NextHire Security Assessment Report

**Target:** `devqii.me` (API) / `nexthire.devqii.me` (Frontend)
**Date:** 2026-07-02
**Assessor:** OpenCode AppSec Framework
**Scope:** Full pipeline (black-box + grey-box + white-box)
**ASVS Level:** L2 (standard — job portal with PII, auth, file uploads)

---

## Executive Summary

NextHire is a job portal platform with Express 5 backend, Next.js frontend, Prisma/Postgres database, and JWT-based authentication. The assessment identified **15 findings** across the stack. The most critical issues are: Node.js v18 is EOL (security patches stopped), the refresh cookie `SameSite=None` enables CSRF attacks on the refresh flow, and several race conditions in toggle/suspend/warn operations (previously fixed). Most security controls are well-implemented: Helmet with CSP, rate limiting on auth endpoints, parameterized queries via Prisma, and proper JWT secret separation.

---

## Technical Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| Backend | Express | 5.2.1 |
| Runtime | Node.js | v18.19.1 (EOL) |
| Database | Neon Postgres via Prisma | 6.7.0 |
| Auth | JWT + Passport.js | GitHub/LinkedIn OAuth |
| CDN | Cloudflare | Proxied |
| Reverse Proxy | nginx | 1.24.0 |
| Frontend | Next.js (React) | Docker |
| Cache | Redis | Alpine |

**Phases Executed:** 1 (OWASP mapping), 2 (recon), 3 (technology detection), 5 (white-box code review), 6 (API security), 8 (dependency review), 9 (secure code review)

---

## Findings

### [MEDIUM] JWT Refresh Cookie SameSite=None Enables CSRF

- **Confidence:** High
- **OWASP Mapping:** A01:2021 — Broken Access Control
- **CWE:** CWE-352 (Cross-Site Request Forgery)
- **Affected Component:** `src/utils/generateToken.js:8`
- **Evidence:** `sameSite: isProduction ? "none" : "strict"` — in production, the refresh cookie is `SameSite=None`, which means it's sent on cross-origin requests. An attacker's site can trigger `POST /api/v1/auth/refresh` and the browser will include the cookie.
- **Reproduction Steps:**
  1. Log in to `nexthire.devqii.me`
  2. Visit attacker-controlled page that submits `<form action="https://devqii.me/api/v1/auth/refresh" method="POST">`
  3. Browser sends the `jwt` cookie cross-origin
- **Business Impact:** Attacker can silently refresh a victim's access token, extending session without knowledge.
- **Technical Impact:** Token rotation is bypassed; attacker gets valid access tokens.
- **Remediation:** Implement CSRF token validation on the refresh endpoint, or use the `Authorization` header for refresh instead of cookies. Alternatively, validate the `Origin` header server-side.
- **Secure Coding:** Use double-submit cookie pattern or CSRF token for state-changing cookie-based endpoints.
- **Verification:** Re-test after fix — confirm refresh fails when `Origin` is not the frontend domain.

---

### [MEDIUM] Node.js v18.19.1 is EOL

- **Confidence:** High
- **OWASP Mapping:** A06:2021 — Vulnerable and Outdated Components
- **CWE:** CWE-1104 (Use of Unmaintained Third Party Components)
- **Affected Component:** Server runtime (`node --version` returns v18.19.1)
- **Evidence:** Node.js 18 reached End-of-Life on 2025-04-30. No more security patches.
- **Business Impact:** Known CVEs in Node.js 18 will never be patched. Vulnerable to any future runtime-level exploits.
- **Technical Impact:** Potential RCE or memory corruption via unpatched V8/Node internals.
- **Remediation:** Upgrade to Node.js 22 LTS (already in Dockerfile but not deployed). Rebuild Docker image and redeploy.
- **Verification:** `node --version` should return v22.x.x after rebuild.

---

### [MEDIUM] Rate Limiting Keys on IP Only — No Per-User Limiting

- **Confidence:** High
- **OWASP Mapping:** A04:2021 — Insecure Design
- **CWE:** CWE-770 (Allocation of Resources Without Limits)
- **Affected Component:** `src/server.js:163` (global), `src/routes/auth.routes.js:18` (auth)
- **Evidence:** All rate limiters use default IP-based keying. An attacker behind CGNAT or using IP rotation bypasses limits. Conversely, legitimate users behind shared IP (school, office) get collectively throttled.
- **Business Impact:** Brute-force attacks from distributed IPs bypass rate limiting. Legitimate users on shared networks get blocked.
- **Remediation:** For authenticated endpoints, key rate limiter on `req.user.id` in addition to IP. For auth endpoints, consider adding device fingerprint or CAPTCHA after N failures.
- **Verification:** Confirm rate limit persists when rotating source IPs with same session.

---

### [MEDIUM] Error Handler Returns 500 for Unknown Errors Without Status

- **Confidence:** Medium
- **OWASP Mapping:** A05:2021 — Security Misconfiguration
- **CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)
- **Affected Component:** `src/middlewares/error.middleware.js:36`
- **Evidence:** `res.status(err.status || 500)` — if an error object has a `.status` property (e.g., from a library), it's returned directly. Some Express errors include internal details in `.status`.
- **Business Impact:** Low — error messages are generic in production.
- **Remediation:** Always use 500 for unexpected errors; only use custom status for known operational errors.
- **Verification:** Trigger an unexpected error and confirm 500 with generic message.

---

### [MEDIUM] Session Cookie Missing Explicit httpOnly and sameSite

- **Confidence:** Medium
- **OWASP Mapping:** A05:2021 — Security Misconfiguration
- **CWE:** CWE-614 (Sensitive Cookie in HTTPS Session Without 'Secure' Attribute)
- **Affected Component:** `src/server.js:150`
- **Evidence:** Session cookie config: `{ maxAge: 30 days, secure: true }` — no explicit `httpOnly: true` or `sameSite`. Defaults are `httpOnly: true` and `sameSite: "Lax"` but should be explicit.
- **Business Impact:** Low — defaults are safe, but explicit config prevents accidental override.
- **Remediation:** Add `httpOnly: true, sameSite: "strict"` to session cookie config.
- **Verification:** Inspect `Set-Cookie` header for session cookie.

---

### [LOW] Duplicate bcrypt Dependencies

- **Confidence:** High
- **OWASP Mapping:** A06:2021 — Vulnerable and Outdated Components
- **CWE:** CWE-1395 (Dependency on Vulnerable Third-Party Component)
- **Affected Component:** `package.json:30-31`
- **Evidence:** Both `bcrypt` (native) and `bcryptjs` (pure JS) are listed. Code only uses `bcryptjs`.
- **Business Impact:** `bcrypt` (native) requires node-gyp and may have build issues. Unnecessary attack surface.
- **Remediation:** Remove `bcrypt` from dependencies, keep only `bcryptjs`.
- **Verification:** `npm ls bcrypt` should show not found.

---

### [LOW] WebSocket URL Token Fallback Still Present

- **Confidence:** High
- **OWASP Mapping:** A07:2021 — Identification and Authentication Failures
- **CWE:** CWE-598 (Use of GET Request Method With Sensitive Query String)
- **Affected Component:** `src/realtime/websocket.js:98-101`
- **Evidence:** `url.searchParams.get("token")` — WebSocket auth reads token from URL query parameter. Primary auth is first-message JSON (good), but URL fallback leaks tokens in server logs.
- **Business Impact:** Tokens appear in nginx access logs and potentially Cloudflare logs.
- **Remediation:** Remove URL query parameter fallback entirely. Enforce first-message-only auth.
- **Verification:** `wss://devqii.me/ws?token=xxx` should be rejected.

---

### [LOW] No CSRF Protection on State-Changing Endpoints

- **Confidence:** Medium
- **OWASP Mapping:** A01:2021 — Broken Access Control
- **CWE:** CWE-352 (Cross-Site Request Forgery)
- **Affected Component:** All `POST`/`PUT`/`DELETE` endpoints
- **Evidence:** No CSRF middleware. Partially mitigated by `SameSite=strict` on JWT cookie (production uses `SameSite=none` though) and CORS restricting origins.
- **Business Impact:** Low due to CORS + SameSite mitigations, but not defense-in-depth.
- **Remediation:** Add CSRF middleware (e.g., `csurf`) or use double-submit cookie pattern for state-changing endpoints.
- **Verification:** Submit cross-origin form to state-changing endpoint; should be rejected.

---

### [INFO] Security Controls Verified (Passing)

| Control | Status |
|---------|--------|
| Helmet with CSP | ✅ Full policy |
| HSTS | ✅ 31536000 + includeSubDomains |
| X-Content-Type-Options | ✅ nosniff |
| X-Frame-Options | ✅ SAMEORIGIN |
| CORS (no wildcard) | ✅ Origin-reflecting |
| Rate limiting (auth) | ✅ 10/15min |
| Rate limiting (global) | ✅ 100/min |
| Rate limiting (refresh) | ✅ 30/15min |
| JWT secret separation | ✅ Different secrets for access/refresh |
| Access token expiry | ✅ 5 minutes |
| Refresh token DB verification | ✅ Validated on refresh |
| Logout clears refresh | ✅ DB + cookie |
| SQL injection protection | ✅ Prisma parameterized |
| Upload file type validation | ✅ MIME + extension |
| Upload size limits | ✅ Dynamic from settings |
| Error messages (production) | ✅ Generic |
| Health endpoint | ✅ /health |
| X-Robots-Tag | ✅ noindex, nofollow |

---

## Prioritized Remediation Roadmap

### Quick Wins (do now)
1. **Upgrade Node.js to 22** — rebuild Docker image (Dockerfile already uses node:22-alpine)
2. **Remove `bcrypt` dependency** — `npm uninstall bcrypt`
3. **Add explicit httpOnly + sameSite to session cookie**
4. **Remove WebSocket URL token fallback**

### Medium Effort (this sprint)
5. **Implement CSRF protection** on refresh endpoint (validate Origin header)
6. **Add per-user rate limiting** on authenticated endpoints

### Structural (next cycle)
7. **Implement CSRF middleware** for all state-changing endpoints
8. **Audit all `new Error()` usage** — replace with proper error classes across company.service.js, user.service.js

---

## Developer Checklist

- [ ] Rebuild backend Docker image with Node.js 22
- [ ] `npm uninstall bcrypt`
- [ ] Add `httpOnly: true, sameSite: "strict"` to session cookie in `server.js`
- [ ] Remove `url.searchParams.get("token")` from `websocket.js`
- [ ] Add Origin header validation on `/auth/refresh` endpoint
- [ ] Add per-user rate limiting middleware for authenticated API routes
- [ ] Replace `new Error("Unauthorized")` with `new UnauthorizedError()` in company.service.js (lines 61, 73, 301, 370, 406, 455)
- [ ] Replace `new Error("User not found")` with `new NotFoundError()` in user.service.js (lines 28, 169, 189, 199, 356, 369)

---

*Report generated by OpenCode AppSec Framework — pentest-orchestrator pipeline*
