---
name: express-security
description: Review Express (and Express-based frameworks like NestJS-on-Express) applications for framework-specific misconfiguration and insecure middleware patterns.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Express.js Security Review

## Purpose
Review Express (and Express-based frameworks like NestJS-on-Express) applications for framework-specific misconfiguration and insecure middleware patterns.

## Scope
Node.js applications using Express as the HTTP layer.

## Inputs
Source access to route/middleware definitions where available; black-box header/behavior signals otherwise.

## Outputs
Findings on missing security middleware, unsafe middleware ordering, and Express-specific misconfiguration.

## Workflow
1. Verify `helmet` (or equivalent manual header configuration) is in use for standard security headers.
2. Review middleware ordering: authentication/authorization middleware must run before the route handler it protects, on every relevant route.
3. Check for wildcard or overly permissive CORS configuration (`origin: '*'` combined with credentialed requests is a common misconfiguration).
4. Review body-parser/multer configuration for upload size limits and allowed MIME types.
5. Check for use of `eval`, `child_process` with unsanitized input, or template engines rendering user input without escaping (SSTI risk).
6. Verify errors are not returned with stack traces in production (`NODE_ENV=production` error handling).
7. **Rate-limit key correctness:** where per-endpoint or per-route rate limiting is in place, confirm the limiter keys on an identity that can't be trivially rotated by an attacker. Verify the client-IP source used by the limiter comes from a trusted derivation (e.g., Express's `req.ip` with `trust proxy` correctly configured for the actual deployment topology) rather than a manually parsed `X-Forwarded-For` header, which is client-controllable unless the proxy chain strips/overwrites it.
8. On authenticated routes, verify rate limiting also keys on user/session identity (not IP alone) — an authenticated attacker cycling IPs or sitting behind CGNAT/shared IPs should not bypass the limit, and legitimate users behind a shared IP (school network, NAT) should not be collectively throttled by one bad actor's traffic.

## Decision Logic
- Wildcard CORS with `credentials: true` is high severity — it effectively defeats same-origin protections for authenticated requests.
- Any route missing its expected auth middleware (found by comparing route list to intended access model) is critical.

## Checklist
- [ ] Security headers (helmet or equivalent) verified
- [ ] Middleware ordering reviewed for every protected route
- [ ] CORS configuration reviewed for wildcard + credentials misconfiguration
- [ ] Upload handling limits reviewed
- [ ] Stack-trace/error leakage in production reviewed
- [ ] Rate-limit key source verified as non-spoofable (`req.ip` + correct `trust proxy` config, not manual XFF parsing)
- [ ] Authenticated-route rate limiting verified to key on user/session identity where appropriate, not IP alone



## False-Positive Reduction

- Confirm the issue is reachable from an actual entry point, not just present in dead code.
- Reproduce with a minimal, isolated request/input before recording a finding.
- Distinguish framework-provided mitigations (e.g., auto-escaping, ORM parameter binding) that may already neutralize the pattern.
- Cross-check configuration-based findings against environment-specific overrides (e.g., a dev-only setting that never ships to production).
- Where automated scanners or static analysis contributed the signal, manually verify before including it in the report.
- Note any finding that could not be independently confirmed as "Unconfirmed / Needs Manual Validation" rather than omitting or overstating it.

## Safe Testing Constraints

This module operates under the framework-wide safety contract:

- Authorized targets only. Never run against a system without explicit, documented permission from its owner.
- Non-destructive by default. Prefer read-only checks, passive fingerprinting, and single, reversible test requests over anything that mutates state.
- No denial-of-service. Never send high-volume traffic, fuzzers at scale, or resource-exhaustion payloads.
- No production data manipulation. Any proof-of-concept that could create, alter, or delete real records must run against a test account, sandbox tenant, or staging environment.
- One proof per finding. Once a vulnerability is confirmed with a single safe reproduction, stop — do not repeat the exploit or escalate further "to be sure."
- Credential handling. Never log, print, or persist secrets, tokens, or credentials encountered during testing; redact them in evidence and reports.
- Escalate, don't exploit. If a finding could lead to significant impact (e.g., full account takeover, RCE, mass data exposure), document the safe proof-of-concept and stop rather than pursuing full exploitation.

## Reporting Contract

Every finding produced by this module must be handed to `report-generator.md` with, at minimum:

- Title, Severity, Confidence
- OWASP mapping and CWE ID
- Affected component / endpoint / file
- Evidence (redacted of secrets)
- Safe reproduction steps
- Business impact and technical impact
- Remediation guidance and secure-coding recommendation
- Verification steps for re-testing after a fix

## References
- OWASP Top 10 (latest)
- OWASP Application Security Verification Standard (ASVS)
- OWASP Web Security Testing Guide (WSTG)
- CWE (MITRE Common Weakness Enumeration)
