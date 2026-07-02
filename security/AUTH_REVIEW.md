# Auth Review Findings — NextHire Backend

**Review date:** 2026-07-02
**Scope:** Registration, login, logout, token refresh, password reset, email verification, JWT configuration
**Branch:** `websocket`

---

## 1. User Enumeration Vectors

### 1.1 Register — Enumeration Risk

| Severity | Medium |
|----------|--------|
| **Endpoint** | `POST /api/v1/auth/register` |
| **Affected code** | `src/controllers/auth.controller.js:70-71` |
| **Evidence** | `throw new BadRequestError("User already exists")` is returned when `findUserByEmail` finds a match. An attacker can probe which emails are registered. |

The `/register` endpoint returns `"User already exists"` when the email is already taken, and a success message for new registrations. This allows email enumeration via the response body.

**Recommendation:** Return a generic message such as `"If your email is not already registered, a verification email has been sent."` regardless of whether the user exists. Send the verification email only for new registrations.

### 1.2 Login — No Enumeration

| Severity | ✅ None |
|----------|---------|
| **Affected code** | `src/controllers/auth.controller.js:111,120` |
| **Evidence** | Both invalid email and wrong password return `"Invalid email or password"`. Confirmed via live testing. |

### 1.3 Forgot Password — No Enumeration

| Severity | ✅ None |
|----------|---------|
| **Affected code** | `src/controllers/auth.controller.js:235-238` |
| **Evidence** | Returns `"If an account exists for that email, a password reset link has been sent."` regardless of whether the email exists. Confirmed via live testing. |

### 1.4 Reset Password — No Enumeration

| Severity | ✅ None |
|----------|---------|
| **Affected code** | `src/controllers/auth.controller.js:250-252` |
| **Evidence** | Returns `"Password reset link is invalid or expired"` (generic, no distinction). |

---

## 2. Rate Limiting

### 2.1 Auth Rate Limiter (register, login, reset-password)

| Severity | Low |
|----------|-----|
| **Affected code** | `src/routes/auth.routes.js:18-27` |
| **Config** | 10 requests per 15-minute window per IP |
| **Evidence** | Confirmed working via live testing — 429 returned on rapid requests. |

Applied to: `POST /register`, `POST /login`, `POST /reset-password`.

### 2.2 Password Reset Rate Limiter (forgot-password)

| Severity | Low |
|----------|-----|
| **Affected code** | `src/routes/auth.routes.js:29-38` |
| **Config** | 3 requests per 1-hour window per IP |
| **Evidence** | Code review — stricter limit appropriate for password reset abuse. |

### 2.3 Missing Rate Limiters

| Severity | Low |
|----------|-----|
| **Endpoint** | `POST /verify-email` (line 67), `POST /refresh` (line 70) |
| **Issue** | No rate limiter applied to verify-email or refresh endpoints. Refresh token rotation could be abused for token enumeration if an attacker possesses a stolen token. |

---

## 3. Password Policy

| Severity | Low |
|----------|-----|
| **Affected code** | `src/routes/auth.routes.js:45,57` |
| **Config** | Minimum 6 characters (`z.string().min(6)`). No complexity requirements. |
| **Evidence** | Zod schema allows any string >= 6 chars. No uppercase, lowercase, digit, or special character requirements. |

**Assessment:** Moderate weakness. 6-character minimum with no complexity requirements permits weak passwords (e.g., `abcdef`, `123456`). NIST SP 800-63 recommends at least 8 characters and checking against breached password lists.

**Recommendation:** Raise minimum to 8 characters, add at least one complexity rule (e.g., require a digit or special character), and implement breached-password check (e.g., Have I Been Pwned API).

---

## 4. Password Reset Flow

### 4.1 Token Generation

| Severity | ✅ Good |
|----------|---------|
| **Affected code** | `src/services/auth.service.js:70` |
| **Method** | `crypto.randomBytes(32).toString("hex")` — 256-bit random token |
| **Evidence** | Cryptographically secure random value. |

### 4.2 Token Storage

| Severity | ✅ Good |
|----------|---------|
| **Affected code** | `src/services/auth.service.js:71` |
| **Method** | SHA-256 hashed before storage. Raw token never persisted. |
| **Evidence** | `crypto.createHash("sha256").update(resetToken).digest("hex")` |

### 4.3 Token Expiry

| Severity | ✅ Good |
|----------|---------|
| **Affected code** | `src/services/auth.service.js:72` |
| **Duration** | 15 minutes |
| **Evidence** | `Date.now() + 15 * 60 * 1000` |

### 4.4 Reuse Protection

| Severity | ✅ Good |
|----------|---------|
| **Affected code** | `src/services/auth.service.js:98-101` |
| **Behavior** | Token set to `null` and `refreshToken` cleared after successful reset. |
| **Evidence** | `resetPasswordToken: null`, `resetPasswordExpires: null`, `refreshToken: null` |

**Overall assessment:** Password reset flow follows best practices — secure random token, hashed in DB, short expiry, single-use, invalidates all existing sessions.

---

## 5. Logout / Refresh Token Invalidation

### 5.1 Logout

| Severity | ✅ Acceptable |
|----------|---------------|
| **Affected code** | `src/controllers/auth.controller.js:155-162` |
| **Behavior** | Clears `refreshToken` in DB to `null`. Clears `jwt` cookie (expires in past). |
| **Evidence** | Line 156: `updateRefreshToken(req.user.id, null)`. Access token remains valid until 5-min expiry (expected JWT behavior — cannot be revoked server-side). |

### 5.2 Refresh Token Rotation

| Severity | ✅ Good |
|----------|---------|
| **Affected code** | `src/controllers/auth.controller.js:207-208` |
| **Behavior** | Each `/refresh` call issues a new refresh token and invalidates the old one in DB. |
| **Evidence** | `generateTokens(...)` called, then `updateRefreshToken(user.id, newRefreshToken)`. |

---

## 6. JWT Configuration

| Severity | Low |
|----------|-----|
| **Affected code** | `src/utils/generateToken.js:18-25` |
| **Algorithm** | HS256 (HMAC with SHA-256) — default for `jsonwebtoken` |
| **Access token expiry** | 5 minutes (line 19: `"5m"`) |
| **Refresh token expiry** | 1 day (line 24: `"1d"`) |
| **Access token claims** | `{ id, role }` |
| **Refresh token claims** | `{ id }` (no `role` — by design per AGENTS.md) |
| **Secrets** | Separate secrets: `JWT_SECRET` (access) and `JWT_REFRESH_SECRET` (refresh) |
| **Cookie config** | `httpOnly: true`, `secure: true` in production, `sameSite: "none"` in production (cross-origin frontend) |

**Issues:**
- HS256 is symmetric — any party with the secret can forge tokens. RS256 or ES256 (asymmetric) would allow signature verification without exposing the signing key.
- No `aud` (audience), `iss` (issuer), or `sub` (subject) claims on either token type.
- Refresh token uses a symmetric secret but does not include a `jti` (JWT ID) for individual revocation tracking.

**Recommendation:** Migrate to RS256/ES256 for access tokens. Add `aud`, `iss`, and `jti` claims.

---

## 7. Email Verification Flow

| Severity | ✅ Good |
|----------|---------|
| **Affected code** | `src/services/auth.service.js:31-32,108-136` |
| **Token generation** | `crypto.randomBytes(32).toString("hex")` — 256-bit random |
| **Token storage** | SHA-256 hashed in DB |
| **Expiry** | 24 hours |
| **One-time use** | Token and expiry cleared after successful verification |
| **Evidence** | Lines 31-33 (generation), 108-136 (verification with expiry check + clearing) |

**Assessment:** Email verification follows best practices. No vulnerabilities identified.

---

## 8. OAuth / Social Login

| Severity | N/A |
|----------|-----|
| **Status** | Not implemented in the reviewed codebase. |
| **Evidence** | No GitHub or LinkedIn OAuth routes, controllers, or service functions in the reviewed files. |

**Note:** When OAuth is added, ensure:
- State parameter with PKCE for CSRF protection
- Strict redirect URI validation (no open redirect)
- Email domain verification for corporate accounts
- Account linking logic prevents account takeover via unverified email

---

## Summary

| Category | Rating | Issues |
|----------|--------|--------|
| Enumeration (register) | ⚠️ Medium | "User already exists" response leaks registered emails |
| Enumeration (login, forgot-pw, reset-pw) | ✅ Good | Generic messages, no enumeration |
| Rate limiting | ✅ Good | Applied to auth endpoints, confirmed working |
| Password policy | ⚠️ Low | min 6 chars, no complexity — weak by modern standards |
| Password reset flow | ✅ Good | 256-bit random, SHA-256 in DB, 15-min expiry, single-use, session invalidation |
| Logout / token invalidation | ✅ Acceptable | Refresh token revoked, access token naturally expires |
| JWT config | ⚠️ Low | HS256 symmetric algorithm, missing standard claims |
| Email verification | ✅ Good | Secure random, hashed in DB, one-time use, 24h expiry |
| OAuth | N/A | Not yet implemented |

**Total:** 3 actionable findings (1 Medium, 2 Low). No Critical or High findings.
