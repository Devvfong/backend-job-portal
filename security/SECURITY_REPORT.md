# Security Assessment Report — NextHire

**Targets:** devqii.me (API backend), nexthire.devqii.me (Next.js frontend)  
**Date:** July 2, 2026  
**Type:** White-box + Black-box (source access: full backend + frontend)  
**Authorization:** Confirmed — targets owned by assessor  
**Status:** ✅ FINAL — All findings verified (see VERIFICATION_REPORT.md)

---

## Executive Summary

NextHire is a Cambodia-focused job platform with an Express 5 / Prisma backend and Next.js 16 frontend. Overall security posture is **good** with solid foundations: Helmet CSP, proper JWT access/refresh token separation, Prisma ORM (no raw SQL), bcrypt password hashing, Zod input validation on all mutations, and `npm audit` reporting zero vulnerabilities. A comprehensive CVE audit confirmed **zero actionable advisories** across all dependencies (Express 5.2.1, Next.js 16.2.6, multer 2.2.0). No critical remote code execution or mass data exposure risks were identified.

The findings below are **low-to-medium severity**, predominantly around hardening gaps and configuration improvements rather than exploitable vulnerabilities. The three highest-priority items are: (1) the frontend storing access tokens in both `localStorage` and a non-`httpOnly` cookie (XSS exfiltration surface), (2) the WebSocket lacking Origin header validation (cross-site WebSocket hijacking risk), and (3) the register endpoint revealing whether an email is already registered (enumeration).

---

## Technical Summary

### Stack

| Layer | Technology | Version |
|---|---|---|
| Backend framework | Express | 5.2.1 |
| ORM | Prisma (PostgreSQL via Neon) | 6.7.0 |
| Frontend framework | Next.js (App Router) | 16.2.6 |
| UI library | React | 19.x |
| Auth | JWT (access 5m + refresh 1d) + OAuth2 (GitHub, LinkedIn) | jsonwebtoken 9.0.3 |
| Frontend auth | jose (JWT lib) + axios interceptors | 6.2.3 |
| Real-time | ws (WebSocket) | 8.21.0 |
| Validation | Zod | 4.3.6 (backend), 3.24.1 (frontend) |
| Storage | Supabase (avatars, resumes, logos) | — |
| Email | Resend | — |
| CDN/WAF | Cloudflare | — |
| Password hashing | bcryptjs | 3.0.3 |

### Phases Executed

1. **Phase 1** — OWASP Top 10 + API Security Top 10 mapping → formalized 199-item checklist (OWASP_CHECKLIST.md)
2. **Phase 2** — Recon: live header/sitemap/endpoint inventory + robots.txt review
3. **Phase 3** — Black-box: public API endpoint testing (unauthenticated)
4. **Phase 5** — White-box: full backend source review (~5000 LoC across controllers/services/middleware)
5. **Phase 6** — API security: REST endpoint authorization, mass assignment, rate limiting
6. **Phase 7** — Business logic: application workflow review
7. **Phase 8** — Dependency review: `npm audit` (0 vulns) + CVE audit (0 actionable advisories)
8. **Phase 9** — Secure code review: injection, crypto, secrets
9. **Auth review** — Full flow analysis: registration, login, logout, password reset, JWT config, rate limiting, enumeration testing (AUTH_REVIEW.md)
10. **Phase 10** — Reporting (this document) + SECURE_CODING_GUIDE.md with concrete remediations

**Not executed (scope limitation):** Phase 4 (grey-box with test accounts — live testing performed for auth), Phase 11/12 (CI/CD and cloud infra — no pipeline/infra access).

---

## Findings

### [MEDIUM] Cross-Site WebSocket Hijacking — Missing Origin Validation

- **Confidence:** High
- **OWASP:** API8:2023 — Security Misconfiguration
- **CWE:** CWE-346 (Origin Validation Error)
- **Affected:** WebSocket endpoint `wss://nexthire.devqii.me/ws` (proxied through nginx to backend)
- **Evidence:** `src/realtime/websocket.js:108` — The `wss.on("connection")` handler never checks the `Origin` header from the HTTP upgrade request. The nginx proxy at `nginx/default.conf` does not add an Origin validation layer either.
- **Reproduction:** An attacker-controlled webpage can open a WebSocket connection to `wss://nexthire.devqii.me/ws`. Since auth is first-message (not cookie-based), the hijack surface is limited — but if the frontend also stores the token in a cookie (see next finding), the combined risk increases.
- **Business Impact:** A malicious site could establish a WebSocket connection if the user has an active session and the token is accessible cross-origin (e.g., via cookie).
- **Technical Impact:** Unauthenticated WS connections are rejected, so standalone hijack is blocked. However, combining with the token cookie (non-httpOnly) could allow exfiltration.
- **Likelihood:** Low (requires XSS or other prerequisite)
- **Remediation:** Validate `Origin` header in the WebSocket `connection` handler against the allowed origin whitelist:
  ```js
  const origin = request.headers.origin;
  if (!origin || !allowedOrigins.includes(origin)) {
    ws.close(1008, "Origin not allowed");
    return;
  }
  ```
- **Verification:** Use a WebSocket test client to connect with a spoofed `Origin: https://evil.com` header and confirm the connection is rejected.

---

### [MEDIUM] Access Token Stored in Non-httpOnly Cookie + localStorage (Frontend)

- **Confidence:** High
- **OWASP:** A04:2021 — Insecure Design; A05:2021 — Security Misconfiguration
- **CWE:** CWE-200 (Exposure of Sensitive Information), CWE-614 (Sensitive Cookie Without httpOnly)
- **Affected:** Frontend `lib/auth-session.ts:13` + `lib/api-backend.ts:52`
- **Evidence:**
  ```ts
  // lib/auth-session.ts:13
  document.cookie = `token=${token}; path=/; SameSite=Lax`
  ```
  - Cookie flag: no `httpOnly`, no `Secure`, `SameSite=Lax` (not `Strict`)
  - Backend independently stores `jwt` refresh cookie with `httpOnly: true` and `SameSite: none` (production)
  - Token is also stored in `localStorage` (`lib/api-backend.ts:52`) and read by axios interceptor
  - The frontend token cookie name (`token`) differs from the backend refresh cookie (`jwt`), so no collision — but the token cookie is readable by JS and sent automatically on same-site requests
- **Business Impact:** An XSS vulnerability would allow full account takeover via token exfiltration from either `localStorage` or the non-httpOnly cookie.
- **Technical Impact:** The token has a 5-minute expiry, limiting the window, but an attacker with XSS can poll for fresh tokens.
- **Likelihood:** Medium (depends on XSS — none were found in this review)
- **Remediation:**
  - Option A: Remove the cookie fallback entirely; use `Authorization: Bearer` header only (already the primary mechanism)
  - Option B: If cookie is needed for server-side rendering, set `httpOnly: true` and `Secure: true` and `SameSite: Strict`
- **Verification:** Confirm token is no longer readable via `document.cookie` in the browser console.

---

### [LOW] WebSocket Rate Limiting Applies Per-Connection, Not Per-User

- **Confidence:** High
- **OWASP:** API4:2023 — Unrestricted Resource Consumption
- **CWE:** CWE-770 (Allocation of Resources Without Limits or Throttling)
- **Affected:** `src/realtime/websocket.js:145-159`
- **Evidence:** Rate limiting is per-WebSocket-connection (in-memory `ws._rateLimit`). An attacker can open unlimited connections and send 30 messages each per 10-second window, bypassing per-user rate control.
- **Business Impact:** A targeted denial-of-service against the WebSocket server by consuming connections and message throughput.
- **Technical Impact:** Each connection is authenticated, so it requires valid tokens — but a compromised account or a user with many sessions can disproportionately consume resources.
- **Likelihood:** Low
- **Remediation:** Add a per-user rate limit that aggregates across all WebSocket connections for the same `userId`:
  ```js
  const userRateLimit = userRateLimits.get(userId) || { count: 0, windowStart: Date.now() };
  ```
- **Verification:** Open multiple WS connections as the same user and verify cumulative rate limiting.

---

### [LOW] Inconsistent Error Responses — Public Endpoints Return Stack Traces in Development

- **Confidence:** High
- **OWASP:** A05:2021 — Security Misconfiguration
- **CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)
- **Affected:** `src/middlewares/error.middleware.js:36-41`
- **Evidence:**
  ```js
  return res.status(err.status || 500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
  ```
  The error handler conditionally exposes stack traces in development. While this is standard practice, the `NODE_ENV` check is the sole gate — no additional controls prevent accidental production exposure if the env var is misconfigured.
- **Business Impact:** In production, stack traces are hidden. Risk is configuration-dependent.
- **Technical Impact:** If `NODE_ENV` is accidentally unset in production, full stack traces would leak internals.
- **Likelihood:** Low
- **Remediation:** Add a second guard: only expose details if `NODE_ENV === 'development'` AND a signed nonce/token is provided, or use a dedicated boolean flag `ERROR_DETAILS_ENABLED`.
- **Verification:** Hit an invalid endpoint in production and confirm no stack trace in the response body.

---

### [LOW] Authorize Middleware Super Admin Override — Implicit Trust

- **Confidence:** High
- **OWASP:** API5:2023 — Broken Function Level Authorization
- **CWE:** CWE-285 (Improper Authorization)
- **Affected:** `src/middlewares/authorize.middleware.js:9`
- **Evidence:**
  ```js
  if (req.user.role !== "super_admin" && !roles.includes(req.user.role)) {
    return next(new ForbiddenError("Forbidden: insufficient permissions"));
  }
  ```
  The `super_admin` role bypasses all role checks automatically.
- **Business Impact:** This is by design per AGENTS.md — super_admin is a God-mode role. Not a bug, but worth documenting as an architectural decision: any compromised super_admin account has full access to everything.
- **Technical Impact:** N/A (by design)
- **Likelihood:** N/A
- **Remediation:** Ensure super_admin accounts are strictly limited and protected with MFA. Consider auditing super_admin session creation and activity.
- **Note:** Design decision, not a vulnerability. Included for awareness.

---

### [LOW] No Audit Trail for Application Status Changes

- **Confidence:** High
- **OWASP:** A09:2021 — Security Logging and Monitoring Failures
- **CWE:** CWE-778 (Insufficient Logging)
- **Affected:** `src/services/application.service.js:148-192` (`updateApplicationStatusService`)
- **Evidence:** When a company_admin changes an application status (pending → reviewed/accepted/rejected), the mutation is written to the `Application` table but no audit log entry (WarningLog or dedicated audit table) is created. Only the `Notification` table records the event. The `WarningLog` model exists but is only used for company suspension/warning actions.
- **Business Impact:** No forensic trail for disputed application decisions. If a candidate claims unfair rejection, there is no immutable record of when and by whom the status was changed.
- **Technical Impact:** Status changes can only be partially reconstructed from the `createdAt` field on the Application record (which records only the last update, not history).
- **Likelihood:** Medium (no active exploitation, but compliance gap)
- **Remediation:** Add a `ModerationLog` or extend `WarningLog` usage to record application status changes with actor ID, timestamp, before/after status values.
- **Verification:** After a status update, query the audit table and confirm the entry exists with correct before/after state.

---

### [LOW] Password Reset Token Not Invalidated on Email Change

- **Confidence:** Medium (code review only)
- **OWASP:** A07:2021 — Identification and Authentication Failures
- **CWE:** CWE-640 (Weak Password Recovery Mechanism)
- **Affected:** `src/services/auth.service.js` — `createPasswordResetToken` + `resetPassword`
- **Evidence:** The password reset token is stored as a sha256 hash on the User record. If a user's email is changed (via an admin or account update), the existing password reset token remains valid until its 15-minute expiry. An attacker who gains access to an active reset link could change the password even after the account email has been updated.
- **Business Impact:** Limited — the reset token requires access to the original email inbox
- **Technical Impact:** Potential for persisted reset token validity after account recovery
- **Likelihood:** Low
- **Remediation:** When `email` is updated on a User record, nullify `resetPasswordToken` and `resetPasswordExpires`.
- **Verification:** Update user email, then attempt to use a previously issued reset token — should be rejected.

---

### [INFO] Register Endpoint Reveals Email Existence (Enumeration)

- **Severity:** Medium
- **Confidence:** High
- **OWASP:** A07:2021 — Identification and Authentication Failures
- **CWE:** CWE-203 (Observable Discrepancy)
- **Affected:** `src/controllers/auth.controller.js:70-71`
- **Evidence:** `throw new BadRequestError("User already exists")` is returned when `findUserByEmail` finds a match for the registration email. This allows an attacker to probe whether specific emails are registered.
- **Business Impact:** Attackers can build a list of registered emails for phishing or credential-stuffing targeting.
- **Technical Impact:** Low — only reveals registration status, not PII. However, it's an unnecessary information leak.
- **Likelihood:** Medium (automated scanning trivial)
- **Remediation:** Return a generic message regardless of whether the user exists. Send the verification email only for new registrations.
  ```diff
  - if (userExists) {
  -   throw new BadRequestError("User already exists");
  - }
  ```
  Replace with:
  ```js
  if (userExists) {
    return res.status(200).json({
      status: "success",
      message: "If your email is not already registered, a verification email has been sent.",
    });
  }
  ```
- **Verification:** Register with an existing email — confirm the same message is returned as for a new registration.

---

### [LOW] Weak Password Policy

- **Confidence:** High
- **OWASP:** A07:2021 — Identification and Authentication Failures
- **CWE:** CWE-521 (Weak Password Requirements)
- **Affected:** `src/routes/auth.routes.js:45,57`
- **Evidence:** Zod schema: `z.string().min(6)` — minimum 6 characters, no complexity requirements (uppercase, lowercase, digit, special character). NIST SP 800-63 recommends at least 8 characters and breached-password checking.
- **Business Impact:** Users may choose weak passwords (e.g., `123456`, `abcdef`) that are easily guessed or brute-forced.
- **Technical Impact:** Rate limiting (10 req/15min) mitigates brute-force, but weak passwords are still vulnerable to credential-stuffing with previously breached password lists.
- **Likelihood:** Medium
- **Remediation:** Raise minimum to 8 characters, add complexity requirement:
  ```diff
  - password: z.string().min(6),
  + password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and a number"),
  ```
- **Verification:** Register with password `abcdefgh` — should be rejected for lacking uppercase/digit.

---

### [LOW] JWT Uses HS256 (Symmetric) Algorithm

- **Confidence:** High
- **OWASP:** A02:2021 — Cryptographic Failures
- **CWE:** CWE-327 (Use of a Broken or Risky Cryptographic Algorithm)
- **Affected:** `src/utils/generateToken.js:18-25` (via `jsonwebtoken`)
- **Evidence:** Both access and refresh tokens are signed with HS256 (HMAC-SHA256) using symmetric secrets `JWT_SECRET` and `JWT_REFRESH_SECRET`. Any service that needs to verify the token must possess the signing secret. Missing JWT standard claims: `aud` (audience), `iss` (issuer), `sub` (subject).
- **Business Impact:** If `JWT_SECRET` is compromised, an attacker can forge valid access tokens for any user.
- **Technical Impact:** Low — separate secrets exist for access and refresh tokens, limiting the blast radius.
- **Likelihood:** Low (secret management appears adequate)
- **Remediation:** Migrate to RS256 (RSA) or ES256 (ECDSA) for asymmetric signing. Add standard claims:
  ```js
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, aud: "nexthire-api", iss: "nexthire", sub: String(user.id) },
    process.env.JWT_SECRET,
    { expiresIn: "5m", algorithm: "RS256" }
  );
  ```
- **Note:** This is a larger architectural change requiring RSA/EC key pair generation, distribution, and rotation procedures. The current HS256 implementation with separate secrets is acceptable for the current scale.

---

### [INFO] CVE Audit — Zero Actionable Advisories

- **Confidence:** High
- **Affected:** All dependencies (backend + frontend)
- **Evidence:** Full CVE audit performed on Express 5.2.1, Next.js 16.2.6, multer 2.2.0, and transitive dependencies. All 8 advisories checked were either rejected, already patched, or affect absent dependencies. See `CVE_AUDIT.md` for full details.
  - Express: CVE-2024-51999 (rejected), CVE-2024-47764 (fixed in 5.0.1), CVE-2024-29041 (fixed in 5.0.0-beta.3)
  - Multer: CVE-2026-2359, -3304, -3520 (fixed in 2.1.0/2.1.1, installed 2.2.0)
  - Next.js: CVE-2026-23870, -29057, -44581, -44579 (all fixed in 16.2.5, installed 16.2.6)
- **Impact:** No dependency-related findings. Both backend and frontend are on fully patched versions.
- **Recommendation:** Continue monitoring with `npm audit` in CI. Consider Dependabot or Renovate for automated update PRs.

---

### [INFO] TypeScript Build Errors Ignored (Frontend)

- **Confidence:** High
- **Affected:** Frontend `next.config.mjs:19`
- **Evidence:**
  ```js
  typescript: { ignoreBuildErrors: true }
  ```
- **Impact:** Type errors that could indicate security-relevant logic flaws (e.g., incorrect type narrowing on user roles) are suppressed at build time.
- **Remediation:** Remove `ignoreBuildErrors` and fix existing TypeScript errors.
- **Verification:** Run `npx tsc --noEmit` and confirm zero errors.

---

### [INFO] Dependency Health — No Known Vulnerabilities

- **Confidence:** High (white-box)
- **Affected:** `package.json` (backend)
- **Evidence:** `npm audit --audit-level=high` returned **0 vulnerabilities**. Key dependencies:
  - Express 5.2.1, Prisma 6.7.0, bcryptjs 3.0.3, jsonwebtoken 9.0.3, ws 8.21.0, zod 4.3.6
  - Helmet 8.1.0, express-rate-limit 8.3.1, cookie-parser, multer 2.1.1
- **Impact:** No dependency-related findings. Supply-chain hygiene is good.
- **Recommendation:** Continue `npm audit` in CI pipeline. Pin versions in `package.json` to prevent unexpected upgrades pulling in vulnerable transitive deps.

---

## Prioritized Remediation Roadmap

| Priority | Finding | Effort | Impact |
|---|---|---|---|---|
| P0 | WebSocket Origin validation (Medium) | 1 hour | Prevents CSWSH |
| P0 | Token cookie hardening (Medium) | 2 hours | Reduces XSS exfiltration surface |
| P0 | Register email enumeration (Medium) | 30 min | Prevents email probing |
| P1 | Per-user WS rate limiting (Low) | 2 hours | Prevents connection-level DoS bypass |
| P1 | Application status audit trail (Low) | 4 hours | Compliance + forensic evidence |
| P2 | Weak password policy (Low) | 1 hour | Hardens credential strength |
| P2 | Reset token invalidation on email change (Low) | 1 hour | Hardens account recovery |
| P2 | JWT migrate to RS256 (Low) | 8+ hours | Cryptographic hardening |
| P3 | Remove `ignoreBuildErrors` (Info) | Varies | Type safety |
| P3 | Dual-guard error stack traces (Info) | 1 hour | Defense-in-depth |

---

## Developer Checklist

- [ ] Add `Origin` header validation to WebSocket `wss.on("connection")` (websocket.js)
- [ ] Remove non-httpOnly `token` cookie from frontend; use Bearer header only
- [ ] Fix register endpoint to return generic message instead of "User already exists" (auth.controller.js)
- [ ] Replace per-connection WS rate limit with per-user aggregate (websocket.js)
- [ ] Create audit log entries for application status changes in `updateApplicationStatusService`
- [ ] Raise password minimum to 8 chars + add complexity requirement (auth.routes.js)
- [ ] Nullify `resetPasswordToken` on email change in user update path
- [ ] Plan migration from HS256 to RS256 for JWT signing (generateToken.js)
- [ ] Set `typescript: { ignoreBuildErrors: false }` and fix TS errors
- [ ] Add a second guard (`ERROR_DETAILS_ENABLED`) alongside `NODE_ENV` for stack traces
- [ ] Verify all items on the OWASP checklist (OWASP_CHECKLIST.md)
- [ ] Read SECURE_CODING_GUIDE.md for copy-paste-ready code remediations

---

## OWASP API Security Top 10 Coverage

| # | Category | Status | Notes |
|---|---|---|---|
| API1 | Broken Object Level Authorization | ✅ Reviewed | Prisma scoped queries; encrypted IDs in transit |
| API2 | Broken Authentication | ✅ Reviewed | JWT access/refresh; rate-limited login; bcrypt |
| API3 | Broken Object Property Level Authorization | ✅ Reviewed | Zod whitelists fields; mass assignment checked |
| API4 | Unrestricted Resource Consumption | ⚠️ Partial | Per-connection WS rate limit (fix recommended) |
| API5 | Broken Function Level Authorization | ✅ Reviewed | `authorize` middleware on all admin endpoints |
| API6 | Unrestricted Access to Sensitive Business Flows | ✅ Reviewed | Application workflow gated by role |
| API7 | Server Side Request Forgery | ✅ Reviewed | No user-controlled outbound fetch URLs |
| API8 | Security Misconfiguration | ⚠️ One finding | WS Origin validation missing |
| API9 | Improper Inventory Management | ✅ Reviewed | OpenAPI doc is protected (super_admin only) |
| API10 | Unsafe Consumption of APIs | ✅ Reviewed | Frontend uses axios with proper error handling |
