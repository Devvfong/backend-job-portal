# 🔍 Full Backend Code Review — NextHire

I reviewed all core source files. Below is a structured report by severity.

---

## 🔴 CRITICAL — Security & Data Risks

### 1. **Email change without re-verification**
**File:** `src/controllers/user.controller.js` + `src/services/user.service.js`
- `updateProfile` / `updateUserController` accept `email` in the body and save it directly without verifying the user owns the new email.
- **Risk:** Account takeover. An attacker who hijacks a session can change the email to one they control, then reset the password.
- **Fix:** Strip `email` from the update payload in `updateProfile`, or require re-authentication / email verification before committing the change.

### 2. **`LOGO_DEV_TOKEN` leaked to client via public URL**
**File:** `src/services/company.service.js` line 56
```js
return `https://img.logo.dev/${domain}?token=${logoDevToken}`;
```
- If `logo.dev` treats this token as a secret, it is now exposed to every end-user in the HTML/JS of the page.
- **Fix:** Proxy logo requests through your backend, or use a token designed for client-side use.

### 3. **Query-param token accepted by `protect` middleware**
**File:** `src/middlewares/protect.middleware.js` line 14
```js
if (!token && req.query && req.query.token) {
  token = req.query.token;
}
```
- Tokens in URLs are logged in server access logs, browser history, and referrer headers. This is a known anti-pattern.
- **Fix:** Remove query-param token acceptance. Use `Authorization: Bearer` headers or cookies only.

### 4. **Settings API has no key whitelist**
**File:** `src/controllers/settings.controller.js` line 39
- `updateSettingsController` blindly upserts any key from the request body. A compromised super_admin session could overwrite `DATABASE_URL`, `JWT_SECRET`, etc., if those were stored in the `Setting` table.
- **Fix:** Maintain a whitelist of allowed setting keys (e.g., `maintenance_mode`, `contact_email`, `max_upload_size_mb`) and reject unknown keys.

### 5. **`private_key.pem` / `public_key.pem` exist in repo root**
- Per `.gitignore` they should be ignored, but if they were ever committed, rolling them back is difficult. Verify they are not in git history. In production, `RSA_PRIVATE_KEY` should come from an env var or secret manager, not a file.

---

## 🟠 HIGH — Bugs & Reliability

### 6. **`||` fallback in `updateProfile` prevents clearing fields**
**File:** `src/services/user.service.js` lines 39-45
```js
headline: data.headline || user.headline,
bio: data.bio || user.bio,
```
- If a user sends `""` to clear a field, it falls back to the existing value. Same for `0`, `false`, or `null`.
- **Fix:** Use `!== undefined` checks:
  ```js
  headline: data.headline !== undefined ? data.headline : user.headline,
  ```

### 7. **Spam threshold is hardcoded**
**File:** `src/services/application.service.js` line 66
```js
if (application.applyCount > 3 && application.status !== "spam") {
```
- Tied to logic in code rather than a configurable setting. Also, the upsert increments `applyCount` on every re-apply, allowing users to game the system by applying/un-applying.
- **Fix:** Move threshold to settings, and consider only counting unique apply attempts within a time window.

### 8. **`getAdminDashboardService` fires ~22 parallel queries**
**File:** `src/services/stats.service.js` lines 62-86
- Running 22 concurrent Prisma queries can exhaust the DB connection pool under load.
- **Fix:** Consider batching counts in a single raw query, using `Promise.allSettled` with a concurrency limit, or denormalizing into a summary table.

### 9. **WebSocket has no `maxPayload` and no size limit on messages**
**File:** `src/realtime/websocket.js` line 105
- A malicious client can send a multi-GB JSON payload and OOM the process before `JSON.parse` throws.
- **Fix:**
  ```js
  wss = new WebSocketServer({ server, path: WS_PATH, maxPayload: 1024 * 1024 });
  ```
  Also validate message structure early.

### 10. **WebSocket rate limit only applies before auth**
**File:** `src/realtime/websocket.js` line 143
```js
ws.on("message", async (rawMessage) => {
  if (ws.authenticated) return;
```
- Once authenticated, the client can send unlimited messages. Add post-auth rate limiting or at least message size checks.

### 11. **WebSocket clients may leak on abnormal disconnect**
- If a client drops without sending `close` (network partition, kill -9), the heartbeat will eventually clean it up (30s). But `clientsByUser/Company/Role` maps could temporarily hold stale entries.
- **Fix:** Consider a periodic sweep (e.g., every 60s) that checks `ws.readyState` on all mapped sockets.

### 12. **`db.js` idle-disconnect may race with in-flight queries**
**File:** `src/config/db.js` lines 66-73
- `disconnectDB` sets `_isConnected = false` and calls `prisma.$disconnect()`. If a query is mid-flight in the middleware, the connection could be torn down from under it.
- **Fix:** Track an in-flight counter or use `Promise.all` with a shutdown gate.

---

## 🟡 MEDIUM — Code Quality & Maintainability

### 13. **`dotenv.config()` called twice**
**File:** `src/services/user.service.js` line 5
- Already called in `server.js`. Redundant and could cause subtle issues if `.env` changes between calls.
- **Fix:** Remove from `user.service.js`.

### 14. **`import errorHandler` placed mid-file**
**File:** `src/server.js` line 162
- Imports should be at the top. This works due to ES module hoisting but is confusing.
- **Fix:** Move to the top with the other imports.

### 15. **Duplicate `MulterError` handler pattern**
**File:** `src/routes/company.routes.js` line 61 and `src/routes/user.routes.js` line 56
- The `handleUploadError` wrapper is copy-pasted across route files.
- **Fix:** Extract to a shared middleware in `middlewares/upload.middleware.js`.

### 16. **No validation that `salaryMin < salaryMax`**
**File:** `src/services/job.service.js`
- The schema doesn't enforce this, and there's no runtime check. A job could be created with `salaryMin: 100000, salaryMax: 50000`.
- **Fix:** Add a `.refine()` in the schema or a service-layer assertion.

### 17. **`coverLetter` has no length limit**
**File:** `src/routes/application.route.js` — no schema validation for `coverLetter`
- A client could send a 50MB cover letter string.
- **Fix:** Add `.max(10000)` (or similar) to the schema.

### 18. **`settings.cache.js` never refreshes from DB**
**File:** `src/config/settings.cache.js`
- `initSettingsCache` runs once at boot. If another instance writes to the `Setting` table, this instance's cache is stale forever.
- **Fix:** Add a TTL or a pub/sub invalidation mechanism. For now, at least reload on a timer (e.g., every 5 minutes).

### 19. **`company.service.js` `suspendCompanyService` is a toggle, not a setter**
**File:** `src/services/company.service.js` line 529
```js
data: { isSuspended: !company.isSuspended }
```
- Same in `user.service.js` line 364. Calling the endpoint toggles state. This violates the principle of least surprise — clients should pass the desired state.
- **Fix:** Accept a boolean in the controller body and set it explicitly.

### 20. **CSP allows `unsafe-inline` for scripts**
**File:** `src/server.js` line 62
```js
scriptSrc: ["'self'", "'unsafe-inline'", ...]
```
- Undermines XSS protection. Use nonces or hashes.
- **Fix:** Generate a nonce per request and inject it into the page.

### 21. **`urlParts.length < 2` check in Supabase URL parsing is fragile**
**File:** `src/services/upload.service.js` lines 122-123, 141-142
- If the bucket name appears elsewhere in the URL (e.g., a file named `logos.jpg` in a different bucket), `split` returns more than 2 parts and the path extraction is wrong.
- **Fix:** Use a proper URL parser:
  ```js
  const url = new URL(publicUrl);
  const pathParts = url.pathname.split('/').filter(Boolean);
  // URL is .../storage/v1/object/public/{bucket}/{path}
  const bucketIdx = pathParts.indexOf('object') + 2;
  const filePath = pathParts.slice(bucketIdx + 1).join('/');
  ```

---

## 🟢 LOW — Style & Minor Issues

### 22. **`email.service.js` silently swallows all send failures**
**File:** `src/services/email.service.js`
- `sendEmail` returns `null` on any failure. Critical emails (password reset, verification) may never arrive with no alert to ops.
- **Fix:** Log failures to a monitoring service or dead-letter queue. At minimum, differentiate between "Resend not configured" (expected) and "Resend returned an error" (alert-worthy).

### 23. **`auth.controller.js` `decryptParam` dual-mode is confusing**
- The function both decrypts and passes through plaintext, depending on regex heuristics. This makes behavior unpredictable.
- **Fix:** Decide: either everything is encrypted, or nothing is. The "try both" approach is a footgun.

### 24. **`getCompanyService` in `company.service.js` was truncated in my read**
- Ensure `getCompanyService` and related functions have proper access control — visible fields should be role-dependent.

### 25. **No tests**
- `package.json` has `"test": "echo \"Error: no test specified\" && exit 1"`. The project has E2E scripts in `features/realtime/` but no unit tests for services or controllers.
- **Fix:** Add a test runner (e.g., Vitest or Jest) and write tests for critical paths: auth, application flow, company creation.

### 26. **`server.js` starts listening before DB is ready**
- Line 168: `app.listen(...)` runs, then `connectDB()` is called. This is intentional for docs/health, but any DB-dependent route returns 500 until DB connects.
- **Fix:** This is acceptable but should be documented. Consider a `/health` endpoint that checks DB connectivity separately.

### 27. **`ws.on("error")` handler only unregisters**
```js
ws.on("error", () => {
  unregisterClient(ws);
});
```
- The error itself is not logged. Add `console.error("WebSocket error:", error)` for observability.

### 28. **Password reset rate limiter is IP-based**
- A distributed attacker can bypass it. Consider adding user-based rate limiting (if user email is known from the request).

### 29. **`createCompanySchema` requires `description`, `location`, `industry`, `size`**
- These are strict `min(1)` requirements. If any of these should be optional, the schema needs adjustment.

### 30. **`job.service.js` `createJobService` accepts `companyId` from body for super_admin**
- This is documented behavior but worth a code comment for clarity, as it bypasses the normal `req.user.companyId` flow.

---

## ✅ Things Done Well

- **Clean architecture**: Controller → Service → Prisma pattern is consistent and testable.
- **Strong auth separation**: Access token vs. refresh token, httpOnly cookies, RS256-style secrets.
- **Role-based authorization**: `authorize()` middleware is used consistently.
- **Zod validation**: Input validation on most routes with `validate()` middleware.
- **WebSocket architecture**: First-message auth, heartbeat, role/company/user targeting is well-designed.
- **Emit-after-success**: WS notifications are sent after DB mutations succeed (per AGENTS.md).
- **Notification payloads centralized**: All built in `notification.service.js`.
- **ID encryption**: AES-256-GCM for opaque IDs with proper IV + auth tag.
- **Error handling**: Custom `AppError` hierarchy with Prisma-specific handling (P2002, P2025).
- **Supabase signed URLs**: Resumes are served via expiring signed URLs, not public.
