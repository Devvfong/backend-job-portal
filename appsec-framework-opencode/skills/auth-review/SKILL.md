---
name: auth-review
description: Assess the strength and correctness of login, registration, password-reset, and multi-factor authentication flows.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Authentication Review

## Purpose
Assess the strength and correctness of login, registration, password-reset, and multi-factor authentication flows.

## Scope
Any authentication mechanism in scope: username/password, OAuth2/OIDC, magic links, MFA/TOTP, passkeys.

## Inputs
Auth mechanism classification from `technology-detector.md`; access to test accounts for safe verification.

## Outputs
Findings on authentication weaknesses: weak password policy, missing rate limiting/lockout, insecure password-reset flow, MFA bypass, credential enumeration.

## Workflow
1. Review password policy (minimum length/complexity, breached-password checking) against current NIST/OWASP guidance.
2. Test login for user-enumeration via response-time or message differences between valid/invalid usernames (observe only, do not brute-force).
3. Review rate limiting/lockout on login and password-reset endpoints (verify a limit exists; do not attempt to exhaust it at volume).
4. Review the password-reset flow: token entropy, expiration, single-use enforcement, and whether the token is leaked via Referer headers or logs.
5. If MFA is present, verify it cannot be bypassed by directly calling a post-auth endpoint, replaying a session, or omitting the MFA step in the request sequence.
6. Verify logout invalidates the session/token server-side, not just client-side.

## Decision Logic
- A missing rate limit is a finding on its own even without demonstrating a full brute-force — do not actually exhaust the limit to prove it.
- Treat any password-reset token that is predictable, non-expiring, or reusable as high severity.
- If MFA can be skipped by direct navigation/API call, this is high/critical severity regardless of how the UI normally flows.

## Checklist
- [ ] Password policy reviewed against current guidance
- [ ] User enumeration checked via observation, not brute force
- [ ] Rate limiting/lockout presence verified on login and reset
- [ ] Password-reset token entropy, expiry, and single-use verified
- [ ] MFA bypass paths tested via direct endpoint access
- [ ] Logout confirmed to invalidate session/token server-side



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
