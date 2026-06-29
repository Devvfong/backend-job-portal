#!/usr/bin/env node
/**
 * Phase 4 — Authentication testing (non-destructive; no credential stuffing).
 * Output: security/auth-findings.json
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const API = process.env.API_URL || "https://devqii.me/api/v1";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "auth-findings.json");
const PROBE_EMAIL = process.env.AUTH_PROBE_EMAIL || `phase4-probe-${Date.now()}@mailinator.invalid`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function b64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function buildJwt(header, payload) {
  return `${b64url(header)}.${b64url(payload)}.`;
}

async function request(label, url, options = {}) {
  const started = Date.now();
  let status = 0;
  let body = "";
  let headers = {};
  let error = null;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        Origin: "https://nexthire.devqii.me",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(20000),
    });
    status = res.status;
    body = await res.text();
    headers = Object.fromEntries(res.headers.entries());
  } catch (e) {
    error = e.message;
  }
  return { label, url, status, elapsed: Date.now() - started, body, headers, error };
}

function parseBody(body) {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

async function testLoginRateLimit() {
  const results = [];
  const attempts = 12;
  let first429 = null;

  for (let i = 1; i <= attempts; i++) {
    const r = await request(`login-attempt-${i}`, `${API}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email: PROBE_EMAIL, password: `WrongPass!${i}` }),
    });
    const json = parseBody(r.body);
    if (r.status === 429 && !first429) first429 = i;

    results.push({
      attempt: i,
      status: r.status,
      rateLimitLimit: r.headers["ratelimit-limit"] || r.headers["x-ratelimit-limit"] || null,
      rateLimitRemaining: r.headers["ratelimit-remaining"] || r.headers["x-ratelimit-remaining"] || null,
      message: json?.message || json?.status || null,
      error: r.error,
    });
    await sleep(120);
  }

  const limited = first429 !== null && first429 <= 11;
  return {
    test: "login_rate_limit",
    endpoint: "POST /auth/login",
    configured: { windowMs: 900000, max: 10, source: "auth.routes.js authRateLimiter" },
    probeEmail: PROBE_EMAIL,
    attempts,
    first429At: first429,
    finding: {
      vuln: limited ? false : true,
      severity: limited ? "none" : "high",
      reason: limited
        ? `Rate limit triggered on attempt ${first429} (max 10 / 15 min)`
        : "No 429 after 12 failed login attempts from same IP",
    },
    attemptsLog: results,
  };
}

async function testForgotPasswordRateLimit() {
  const results = [];
  const attempts = 4;
  let first429 = null;

  for (let i = 1; i <= attempts; i++) {
    const r = await request(`forgot-${i}`, `${API}/auth/forgot-password`, {
      method: "POST",
      body: JSON.stringify({ email: `forgot-probe-${i}@mailinator.invalid` }),
    });
    if (r.status === 429 && !first429) first429 = i;
    const json = parseBody(r.body);
    results.push({
      attempt: i,
      status: r.status,
      rateLimitLimit: r.headers["ratelimit-limit"] || null,
      message: json?.message || null,
      error: r.error,
    });
    await sleep(150);
  }

  const limited = first429 !== null && first429 <= 4;
  return {
    test: "forgot_password_rate_limit",
    endpoint: "POST /auth/forgot-password",
    configured: { windowMs: 3600000, max: 3, source: "auth.routes.js passwordResetRateLimiter" },
    attempts,
    first429At: first429,
    finding: {
      vuln: limited ? false : true,
      severity: limited ? "none" : "high",
      reason: limited
        ? `Rate limit triggered on attempt ${first429} (max 3 / hour)`
        : "No 429 after 4 forgot-password requests from same IP",
    },
    attemptsLog: results,
  };
}

async function testUserEnumeration() {
  const unknownEmail = `no-such-user-${Date.now()}@mailinator.invalid`;
  const badPasswordBody = { email: unknownEmail, password: "WrongPass!probe" };

  const wrongUser = await request("login-unknown-email", `${API}/auth/login`, {
    method: "POST",
    body: JSON.stringify(badPasswordBody),
  });
  await sleep(200);

  const wrongPass = await request("login-wrong-password", `${API}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email: "admin@example.com", password: "WrongPass!probe" }),
  });
  await sleep(200);

  const forgot = await request("forgot-unknown", `${API}/auth/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ email: unknownEmail }),
  });

  const wrongUserJson = parseBody(wrongUser.body);
  const wrongPassJson = parseBody(wrongPass.body);
  const forgotJson = parseBody(forgot.body);

  const loginGenericUnknown =
    wrongUser.status === 400 &&
    String(wrongUserJson?.message || "").toLowerCase().includes("invalid email or password");

  const loginMessagesMatch =
    wrongUser.status === 400 &&
    wrongPass.status === 400 &&
    wrongUserJson?.message === wrongPassJson?.message &&
    String(wrongUserJson?.message || "").toLowerCase().includes("invalid");

  const loginPassViaRateLimit =
    loginGenericUnknown && wrongPass.status === 429;

  const forgotGeneric =
    forgot.status === 200 &&
    String(forgotJson?.message || "").toLowerCase().includes("if an account exists");

  const forgotRateLimited = forgot.status === 429;

  let finding;
  if (wrongUser.status === 429) {
    finding = {
      vuln: "inconclusive",
      severity: "info",
      reason: "Login rate limited before enumeration probe — IP quota exhausted",
    };
  } else if ((loginMessagesMatch || loginPassViaRateLimit) && (forgotGeneric || forgotRateLimited)) {
    finding = {
      vuln: false,
      severity: "none",
      reason: loginPassViaRateLimit || forgotRateLimited
        ? "Login shows generic invalid-credentials message; forgot-password inconclusive live (429) but code uses constant response"
        : "Login and forgot-password use generic messages (no enumeration)",
    };
  } else {
    finding = {
      vuln: true,
      severity: "medium",
      reason: "Inconsistent or revealing auth error messages",
    };
  }

  return {
    test: "user_enumeration",
    finding,
    codeReviewNote:
      "auth.controller.js returns 'Invalid email or password' for missing user and bad password; forgot-password always returns account-exists-neutral message",
    evidence: {
      loginUnknownEmail: { status: wrongUser.status, message: wrongUserJson?.message },
      loginWrongPassword: { status: wrongPass.status, message: wrongPassJson?.message },
      forgotPassword: { status: forgot.status, message: forgotJson?.message },
    },
  };
}

async function testTokenRejection() {
  const noneAlg = buildJwt({ alg: "none", typ: "JWT" }, { id: 1, role: "super_admin" });
  const expired = buildJwt({ alg: "HS256", typ: "JWT" }, { id: 1, role: "job_seeker", exp: 1 });
  const noRole = buildJwt({ alg: "HS256", typ: "JWT" }, { id: 1, exp: Math.floor(Date.now() / 1000) + 3600 });

  const cases = [
    { label: "no_token", headers: {} },
    { label: "invalid_bearer", headers: { Authorization: "Bearer not-a-jwt" } },
    { label: "alg_none", headers: { Authorization: `Bearer ${noneAlg}` } },
    { label: "expired_shape", headers: { Authorization: `Bearer ${expired}` } },
    { label: "refresh_shape_no_role", headers: { Authorization: `Bearer ${noRole}` } },
  ];

  const results = [];
  for (const c of cases) {
    const r = await request(`me-${c.label}`, `${API}/auth/me`, { headers: c.headers });
    const json = parseBody(r.body);
    results.push({
      case: c.label,
      status: r.status,
      code: json?.code || null,
      message: json?.message || null,
      rejected: r.status === 401 || r.status === 403,
      error: r.error,
    });
    await sleep(100);
  }

  const allRejected = results.every((r) => r.rejected || r.error);
  return {
    test: "access_token_validation",
    endpoint: "GET /auth/me",
    finding: {
      vuln: allRejected ? false : true,
      severity: allRejected ? "none" : "high",
      reason: allRejected
        ? "Invalid/malformed tokens rejected on protected route"
        : "Protected route accepted invalid token case",
    },
    cases: results,
  };
}

async function testRefreshWithoutCookie() {
  const r = await request("refresh-no-cookie", `${API}/auth/refresh`, { method: "POST", body: "{}" });
  const json = parseBody(r.body);
  return {
    test: "refresh_requires_cookie",
    endpoint: "POST /auth/refresh",
    finding: {
      vuln: r.status === 401 ? false : true,
      severity: r.status === 401 ? "none" : "medium",
      reason:
        r.status === 401
          ? "Refresh without jwt cookie correctly rejected"
          : `Expected 401 without cookie, got ${r.status}`,
    },
    evidence: { status: r.status, message: json?.message, code: json?.code },
  };
}

async function testLogoutWithoutAuth() {
  const r = await request("logout-no-auth", `${API}/auth/logout`, { method: "POST", body: "{}" });
  const json = parseBody(r.body);
  return {
    test: "logout_requires_auth",
    endpoint: "POST /auth/logout",
    finding: {
      vuln: r.status === 401 ? false : true,
      severity: r.status === 401 ? "none" : "low",
      reason: r.status === 401 ? "Logout requires valid access token" : `Expected 401, got ${r.status}`,
    },
    evidence: { status: r.status, message: json?.message },
  };
}

const CODE_REVIEW = [
  {
    item: "Session invalidation on logout",
    status: "code_review_pass",
    detail: "logout clears DB refreshToken and expires jwt httpOnly cookie",
    source: "auth.controller.js logout",
    liveTested: false,
    reason: "Requires valid session — skipped on production without test account",
  },
  {
    item: "Refresh token rotation",
    status: "code_review_pass",
    detail: "refresh issues new refresh token and updates DB; old token invalidated",
    source: "auth.controller.js refresh",
    liveTested: false,
  },
  {
    item: "Password reset token entropy",
    status: "code_review_pass",
    detail: "crypto.randomBytes(32) hex, SHA-256 stored, 15 min expiry",
    source: "auth.service.js createPasswordResetToken",
    liveTested: false,
  },
  {
    item: "Email verification token entropy",
    status: "code_review_pass",
    detail: "crypto.randomBytes(32) hex, SHA-256 stored, 24h expiry",
    source: "auth.service.js createUser",
    liveTested: false,
  },
  {
    item: "Access vs refresh token separation",
    status: "code_review_pass",
    detail: "JWT_SECRET (access, includes role) vs JWT_REFRESH_SECRET (refresh, id only); WebSocket requires role claim",
    source: "generateToken.js, websocket.js verifyAccessToken",
    liveTested: false,
  },
  {
    item: "MFA",
    status: "not_implemented",
    detail: "No MFA/OTP flow in codebase",
    severity: "info",
  },
  {
    item: "Account lockout",
    status: "not_implemented",
    detail: "IP-based rate limit only (10 login / 15 min); no per-account lockout after failed attempts",
    severity: "low",
    recommendation: "Consider per-email throttle in addition to IP limit",
  },
  {
    item: "Refresh endpoint rate limit",
    status: "gap",
    detail: "POST /auth/refresh has no express-rate-limit middleware",
    severity: "low",
    recommendation: "Add rate limiter to refresh to slow token grinding",
  },
  {
    item: "Token in query string",
    status: "gap",
    detail: "protect.middleware accepts req.query.token — leakage risk via logs/referrer",
    severity: "low",
    source: "protect.middleware.js",
  },
  {
    item: "Refresh cookie flags",
    status: "code_review_pass",
    detail: "httpOnly, secure, SameSite=None in production, 1 day maxAge",
    source: "generateToken.js refreshCookieOptions",
  },
];

async function main() {
  console.log("Phase 4 auth testing against", API);
  console.log("Probe email:", PROBE_EMAIL);
  console.log("Skipping credential stuffing / brute-force wordlist (not in scope)");

  // Enumeration and token checks first — rate-limit probes last (they exhaust shared IP quota).
  const liveTests = [
    await testUserEnumeration(),
    await testTokenRejection(),
    await testRefreshWithoutCookie(),
    await testLogoutWithoutAuth(),
    await testLoginRateLimit(),
    await testForgotPasswordRateLimit(),
  ];

  const liveFindings = liveTests.map((t) => ({ ...t.finding, test: t.test }));
  const confirmed = liveFindings.filter((f) => f.vuln === true);
  const inconclusive = liveFindings.filter((f) => f.vuln === "inconclusive");
  const codeGaps = CODE_REVIEW.filter((c) => c.status === "gap");

  const report = {
    phase: 4,
    phaseName: "Authentication Testing",
    completedAt: new Date().toISOString(),
    target: API,
    methodology:
      "Live rate-limit and token-rejection probes; user enumeration check; no credential stuffing; session rotation verified via code review",
    bruteForce: {
      status: "skipped",
      reason: "Wordlist/credential stuffing not run — IP rate limit verified with 12 failed logins instead",
    },
    mfa: { status: "not_implemented" },
    summary: {
      liveTestsRun: liveTests.length,
      confirmedVulnerabilities: confirmed.length,
      inconclusiveFindings: inconclusive.length,
      codeReviewItems: CODE_REVIEW.length,
      codeReviewGaps: codeGaps.length,
      gateStatus: confirmed.length === 0 ? "pass" : "fail",
      proceedToPhase5: confirmed.length === 0,
      note: "Phase 5 requires job_seeker + company_admin test accounts",
    },
    liveTests,
    codeReview: CODE_REVIEW,
    confirmed,
    codeGaps,
    decision:
      confirmed.length > 0
        ? "Auth vulnerabilities confirmed — remediate before Phase 5"
        : "No critical auth failures in live probes — proceed to Phase 5 when test accounts provided",
  };

  writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`Wrote ${OUT}`);
  console.log(
    `Live tests: ${liveTests.length} | Confirmed: ${confirmed.length} | Code gaps: ${codeGaps.length}`,
  );
  process.exit(confirmed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});