# NextHire Security Assessment Report

**Generated:** 2026-06-29T04:46:56.220Z
**Scope:** https://nexthire.devqii.me, https://devqii.me/api/v1
**Branch:** websocket (production)

## Executive summary

Seven-phase OWASP-aligned assessment of NextHire production (websocket branch) found **no confirmed exploitable vulnerabilities** in injection, reflected XSS, authentication, or access-control testing. One **unconfirmed untested** stored-XSS path remains (JsonLd.tsx `</script>` breakout via job title). npm audit reported **0 moderate+ CVEs**. Ten recommendations (REC-001–REC-010) cover CSP, JSON-LD validation, auth hardening, mass-assignment strict schemas, and input-validation polish.

| Metric | Value |
| --- | --- |
| Phases completed | 7 / 7 |
| Total automated probes/tests | 185 |
| **Confirmed vulnerabilities** | **0** |
| Open recommendations | 10 |
| Untested risks (unconfirmed) | 1 |
| npm audit (moderate+) | 0 CVEs |

## Phase results

| Phase | Status | Confirmed | Key outcome |
| --- | --- | --- | --- |
| 1 Reconnaissance | done | 0 | 104 endpoints mapped |
| 2 Injection | done | 0 | 77 probes; Prisma parameterized queries |
| 3 XSS | done | 0 | 70 reflected probes clean; stored XSS skipped — JsonLd risk untested |
| 4 Authentication | done | 0 | Login 10/15min + forgot 3/hr rate limits verified |
| 5 Access control | done | 0 | 32 IDOR/privilege tests passed |
| 6 Security headers | done | 0 | HSTS, XFO, nosniff on frontend + API; frontend CSP gap |
| 7 Reporting | done | 0 | This report |

## Confirmed vulnerabilities

None identified during live/automated testing.

## Untested risks (unconfirmed)

These were not proven on production but warrant validation before closing the assessment.

- **REC-002** — Stored XSS via JSON-LD </script> breakout (unconfirmed, untested) (medium)
  Phase 3 stored XSS was skipped on production. JsonLd.tsx uses dangerouslySetInnerHTML + JSON.stringify, which does not neutralize </script> in strings. Exploitability is unverified but plausible if a company_admin can persist a malicious job title.

## Recommendations (REC-001 … REC-010)

### REC-001 — Add Content-Security-Policy on frontend (medium) CVSS 5.3

Add a tuned CSP in next.config or nginx for nexthire.devqii.me; test with report-only mode first.

### REC-002 — Stored XSS via JSON-LD </script> breakout (unconfirmed, untested) (medium) CVSS 5.4 — *untested risk*

> Phase 3 stored XSS was skipped on production. JsonLd.tsx uses dangerouslySetInnerHTML + JSON.stringify, which does not neutralize </script> in strings. Exploitability is unverified but plausible if a company_admin can persist a malicious job title.
Test stored payload on staging; escape U+003C in JsonLd output or use a safe JSON-LD serializer; reject/sanitize </script> in job titles on write.

### REC-003 — Rate-limit POST /auth/refresh (low) CVSS 3.7

Apply express-rate-limit to /auth/refresh (e.g. 30/hour per IP).

### REC-004 — Remove token acceptance via query string (low) CVSS 3.1

Drop req.query.token in protect.middleware; use Authorization header or cookie only.

### REC-005 — Return 400 instead of 500 for invalid jobType filter values (low) CVSS 3.7

> 7 probes returned 500 on malformed jobType — not confirmed SQLi; Prisma enum validation error
Validate jobType against allowed enum before query; map to 400 Bad Request.

### REC-006 — Run authorize() before validate() on POST /jobs/create (low) CVSS 0

Reorder middleware: protect → authorize → validate to return 403 for wrong roles consistently.

### REC-007 — Add MFA for admin accounts (info)

TOTP or WebAuthn for company_admin and super_admin roles.

### REC-008 — Per-email login throttle (in addition to IP limit) (low)

Track failed attempts per email hash; temporary lockout after N failures.

### REC-009 — Strengthen WebSocket rate limiting (low)

Tighten ws event limits; consider per-user quotas after auth.

### REC-010 — Use Zod .strict() on company update/create schemas (mass assignment) (low) CVSS 4.3

> company.routes.js uses .passthrough() on updateCompanySchema and createCompanySchema — extra JSON keys are not rejected.
Replace .passthrough() with .strict() (or explicit .strip()) on company and profile Zod schemas so unknown fields cannot be mass-assigned.

## OWASP Top 10 (2021) coverage

- [x] **A01** Broken access control — 32 tests passed; IDOR blocked
- [x] **A02** Cryptographic failures — TLS, httpOnly refresh cookie, bcrypt passwords
- [x] **A03** Injection — 0 confirmed SQLi; 7 jobType 500s under review
- [x] **A04** Insecure design — Rate limits, token separation, generic auth errors
- [x] **A05** Security misconfiguration — Headers mostly good; frontend CSP gap
- [x] **A06** Vulnerable components — npm audit moderate+: 0 (2026-06-29)
- [x] **A07** Authentication failures — Rate limits OK; MFA not implemented
- [ ] **A08** Software/data integrity — No CI SAST/signing audit in this pass
- [ ] **A09** Logging & monitoring — Admin logs exist; no SIEM review
- [x] **A10** SSRF — No user-controlled URL fetch endpoints found

## Tests skipped / limitations

- Stored XSS write test not performed on production — JsonLd </script> path unconfirmed (see REC-002).
- Credential-stuffing / brute-force wordlist not run (IP rate limit verified instead).
- Multi-server WebSocket / Redis pub-sub not in scope.

## Re-run commands

```bash
node security/run-injection-phase2.js
node security/run-xss-phase3.js
node security/run-auth-phase4.js
node security/run-access-control-phase5.js
node security/run-report-phase7.js
npm audit --audit-level=moderate
npm run verify:production
```
