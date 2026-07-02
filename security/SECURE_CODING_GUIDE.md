# Secure Coding Guide — NextHire Backend

**Generated from:** AUTH_REVIEW.md + OWASP_CHECKLIST.md findings  
**Date:** 2026-07-02

---

## Finding 1: Register Endpoint Reveals "User already exists"

**Severity:** Medium  
**Source:** AUTH_REVIEW.md §1.1  
**File:** `src/controllers/auth.controller.js:70-72`

### Vulnerable code

```javascript
const userExists = await findUserByEmail(email);
if (userExists) {
  throw new BadRequestError("User already exists");
}
```

An attacker can probe which emails are registered by observing the response body ("User already exists" vs. success).

### Remediated code

```javascript
const userExists = await findUserByEmail(email);
if (userExists) {
  return res.status(201).json({
    status: "success",
    message: "If your email is not already registered, a verification email has been sent.",
  });
}
```

Always return the same generic success message. Do **not** reveal whether the email exists. No email is sent (or a harmless one if desired), but the attacker cannot distinguish between registered and unregistered addresses.

---

## Finding 2: WebSocket Missing Origin Validation

**Severity:** Medium  
**Source:** OWASP_CHECKLIST.md — API8-02, WSTG-SESS-09  
**File:** `src/realtime/websocket.js:105-108`

### Vulnerable code

```javascript
const initRealtime = (server) => {
  wss = new WebSocketServer({ server, path: WS_PATH, maxPayload: 1024 * 1024 });

  wss.on("connection", async (ws, request) => {
    // No Origin check — any site can open a WS connection
```

Without Origin validation, a malicious website can open a cross-origin WebSocket connection to the server. If the victim is already authenticated (e.g., via cookie) or the attacker provides a token, this enables Cross-Site WebSocket Hijacking (CSWSH).

### Remediated code

Add a helper at the top of the file and use it in the connection handler:

```javascript
// Add near the top of websocket.js, after the imports
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

const isValidOrigin = (request) => {
  const origin = request.headers["origin"];
  if (!origin) return false;
  return ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));
};
```

Then in the `connection` handler at line 108, add the check as the first guard:

```javascript
wss.on("connection", async (ws, request) => {
  // --- ADD THIS BLOCK ---
  if (!isValidOrigin(request)) {
    console.warn(`[ws] Rejected connection from invalid origin: ${request.headers["origin"] || "none"}`);
    ws.close(1008, "Origin not allowed");
    return;
  }
  // --- END ADDED BLOCK ---

  let authTimer = null;
  // ... rest of handler
});
```

**Why it works:** The Origin header is set by the browser and cannot be forged by client-side JavaScript. Checking it against the known whitelist prevents malicious sites from opening cross-origin WebSocket connections.

---

## Finding 3: Password Policy Too Weak (min 6 chars only)

**Severity:** Low  
**Source:** AUTH_REVIEW.md §3  
**File:** `src/routes/auth.routes.js:45,57`

### Vulnerable code

```javascript
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(6),
});
```

6-character minimum with no complexity allows trivial passwords like `123456` or `abcdef`.

### Remediated code

```javascript
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: passwordSchema,
});

const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: passwordSchema,
});
```

**Why it works:** Enforces NIST SP 800-63B minimum standards (8+ characters, mixed case, digits, special chars). The `passwordSchema` is shared between registration and password reset so both use the same rules. Users get clear feedback on which requirement is not met via Zod's error messages.

---

## Finding 4: JWT Uses HS256 (Symmetric) Instead of RS256

**Severity:** Low  
**Source:** AUTH_REVIEW.md §6  
**File:** `src/utils/generateToken.js:18-25`

### Vulnerable code

```javascript
const accessToken = jwt.sign(
  { id: userId, role: role },
  process.env.JWT_SECRET,          // symmetric secret
  { expiresIn: "5m" }
);
```

HS256 uses the same secret for signing and verification. Any service that verifies tokens can also forge them.

### Remediated code — RS256 Migration

**Step 1:** Generate an RSA key pair (done once, outside the app):

```bash
# Generate private key (keep secret, never commit)
openssl genrsa -out private.pem 2048

# Extract public key (safe to distribute to verifying services)
openssl rsa -in private.pem -pubout -out public.pem
```

**Step 2:** Set environment variables:

```env
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

**Step 3:** Update `generateToken.js`:

```javascript
import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";

const getPrivateKey = () => {
  const key = process.env.JWT_PRIVATE_KEY;
  if (!key) throw new Error("JWT_PRIVATE_KEY must be set");
  return key.replace(/\\n/g, "\n");
};

const getPublicKey = () => {
  const key = process.env.JWT_PUBLIC_KEY;
  if (!key) throw new Error("JWT_PUBLIC_KEY must be set");
  return key.replace(/\\n/g, "\n");
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "strict",
  maxAge: 1 * 24 * 60 * 60 * 1000,
};

const generateTokens = (userId, role, res) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET must be set in environment");
  }

  // Access token signed with RS256 (asymmetric)
  const accessToken = jwt.sign(
    { id: userId, role: role },
    getPrivateKey(),
    {
      algorithm: "RS256",
      expiresIn: "5m",
      issuer: "nexthire-backend",
      subject: String(userId),
    }
  );

  // Refresh token stays HS256 (not exposed to third parties)
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "1d" }
  );

  res.cookie("jwt", refreshToken, refreshCookieOptions);
  return { accessToken, refreshToken };
};

export default generateTokens;
```

**Step 4:** Update `verifyAccessToken` in `websocket.js` and any other verification point to use the public key:

```javascript
const getPublicKey = () => {
  const key = process.env.JWT_PUBLIC_KEY;
  if (!key) return null;
  return key.replace(/\\n/g, "\n");
};

const verifyAccessToken = async (token) => {
  if (!token) return null;
  try {
    const publicKey = getPublicKey();
    if (!publicKey) {
      // Fallback to HS256 during migration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded?.id || !decoded?.role) return null;
      return prisma.user.findUnique({ ... });
    }

    const decoded = jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: "nexthire-backend",
    });

    if (!decoded?.id || !decoded?.role) return null;
    return prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, companyId: true, name: true },
    });
  } catch {
    return null;
  }
};
```

**Why it works:** With RS256, the private key (used for signing) is kept secret on the authentication server. Any other service (microservice, WebSocket server, frontend gateway) can verify tokens using the public key without being able to forge them. This also enables future service decomposition.

---

## Finding 5: Rate Limiting Missing on verify-email and refresh

**Severity:** Low  
**Source:** AUTH_REVIEW.md §2.3  
**File:** `src/routes/auth.routes.js:67,70`

### Vulnerable code

```javascript
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/refresh", refresh);
```

No rate limiting on these endpoints allows brute-force token guessing (verify-email) and unlimited refresh token rotation attempts.

### Remediated code

```javascript
router.post("/verify-email", authRateLimiter, validate(verifyEmailSchema), verifyEmail);
router.post("/refresh", authRateLimiter, refresh);
```

**Why it works:** Reuses the existing `authRateLimiter` (10 requests per 15 minutes) configured at the top of the file. This prevents automated brute-force attacks on email verification tokens and refresh token rotation abuse.

---

## Finding 6: Single NODE_ENV Gate for Stack Traces

**Severity:** Low  
**Source:** OWASP_CHECKLIST.md — A05-03, WSTG-ERRH-02  
**File:** `src/middlewares/error.middleware.js:39-40`

### Vulnerable code

```javascript
return res.status(err.status || 500).json({
  status: 'error',
  code: 'INTERNAL_ERROR',
  message: process.env.NODE_ENV === 'development' ? (err.message || 'Internal Server Error') : 'Internal Server Error',
  ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
})
```

A single environment variable check means that if `NODE_ENV` is accidentally set to `development` in production, full stack traces leak to clients.

### Remediated code

```javascript
const SHOW_STACK_TRACES = process.env.NODE_ENV === 'development' && process.env.ERROR_VERBOSE === 'true';

return res.status(err.status || 500).json({
  status: 'error',
  code: 'INTERNAL_ERROR',
  message: SHOW_STACK_TRACES ? (err.message || 'Internal Server Error') : 'Internal Server Error',
  ...(SHOW_STACK_TRACES && { stack: err.stack }),
})
```

**Why it works:** Requires **both** `NODE_ENV=development` **and** an explicit `ERROR_VERBOSE=true` opt-in. A single misconfiguration cannot expose stack traces. In production, even if `NODE_ENV=development` is accidentally set, traces remain hidden unless `ERROR_VERBOSE` is also `true`.

---

## Finding 7: Access Token in Non-httpOnly Cookie + localStorage

**Severity:** Medium  
**Source:** OWASP_CHECKLIST.md — A04-03, V3-01, WSTG-CLNT-12  
**File:** Frontend (separate repo: `lib/auth-session.ts`, `components/shared/NotificationBell.tsx`)

### Vulnerable code (frontend)

```typescript
// Frontend stores access token in both localStorage and a non-httpOnly cookie
localStorage.setItem("token", accessToken);
document.cookie = `token=${accessToken}; path=/; max-age=300`;  // No httpOnly, no Secure, SameSite=Lax
```

Any XSS vulnerability can exfiltrate the access token from either storage location.

### Remediated code (frontend)

**Option A — Server-only access token (recommended):**

Remove the client-side access token cookie entirely. Use only `Authorization: Bearer` header from `localStorage` (or in-memory storage). The backend already supports this pattern.

```typescript
// lib/auth-session.ts
// Remove this line entirely:
// document.cookie = `token=${accessToken}; path=/; max-age=300`;
```

**Option B — If cookie is required:**

```typescript
document.cookie = [
  `token=${accessToken}`,
  "path=/",
  "max-age=300",
  "httpOnly",          // Not accessible via document.cookie
  "secure",            // HTTPS only
  "SameSite=Strict",   // No cross-site requests
].join("; ");
```

**Why it works:** `httpOnly` prevents JavaScript access (`document.cookie`), stopping XSS from reading the token. `Secure` ensures the cookie is only sent over HTTPS. `SameSite=Strict` prevents the cookie from being sent in cross-origin requests. For maximum security, storing the access token only in memory (not in `localStorage`) and using `Authorization: Bearer` is best.

---

## Finding 8: No Audit Trail for Application Status Changes

**Severity:** Low  
**Source:** OWASP_CHECKLIST.md — A09-02, WSTG-BL-08  
**File:** `src/services/application.service.js:148-192`

### Vulnerable code

```javascript
const updateApplicationStatusService = async (applicationId, status, user) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  // ... authorization checks ...
  return prisma.application.update({
    where: { id: applicationId },
    data: { status },
    // ... include config ...
  });
};
```

No logging — when a company admin changes an application status, there is no record of who made the change, what the old status was, or when it occurred.

### Remediated code

```javascript
const updateApplicationStatusService = async (applicationId, status, user) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  // Check if user is the admin of the company that posted the job
  if (!user || (user.role !== SUPER_ADMIN_ROLE && user.companyId !== application.job.companyId)) {
    throw new ForbiddenError("You cannot manage applications for other companies");
  }

  // --- ADDED: Audit log ---
  const correlationId = crypto.randomUUID();
  console.log(
    JSON.stringify({
      type: "audit:application:status_change",
      correlationId,
      timestamp: new Date().toISOString(),
      applicationId: application.id,
      jobId: application.job.id,
      previousStatus: application.status,
      newStatus: status,
      changedBy: { userId: user.id, role: user.role, companyId: user.companyId },
    })
  );
  // --- END ADDED ---

  return prisma.application.update({
    where: { id: applicationId },
    data: { status },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          headline: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          companyId: true,
          company: {
            select: {
              companyName: true,
              logo: true,
              isVerified: true,
            },
          },
        },
      },
    },
  });
};
```

Add the `crypto` import at the top of the file:

```javascript
import crypto from "crypto";
```

**Why it works:** Each status change is logged as structured JSON with a unique `correlationId`, the previous and new status, and the identity of the user who made the change. In production, these logs can be piped to a centralized logging system (ELK, CloudWatch, etc.) for forensic analysis and compliance. The `correlationId` can be surfaced to the HTTP response header for traceability.
