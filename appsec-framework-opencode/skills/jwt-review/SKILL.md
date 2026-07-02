---
name: jwt-review
description: Assess JSON Web Token issuance, validation, and lifecycle handling for common implementation flaws.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# JWT Review

## Purpose
Assess JSON Web Token issuance, validation, and lifecycle handling for common implementation flaws.

## Scope
Any application using JWTs for session or API authentication.

## Inputs
Sample JWTs from a test account; backend source if available for validation-library configuration review.

## Outputs
Findings on JWT algorithm confusion, weak signing secrets, missing expiration/validation, and improper claim trust.

## Workflow
1. Decode a sample JWT (header + payload) and review the algorithm (`alg`) and claims present.
2. Verify the server rejects tokens with `alg: none` and rejects algorithm-confusion attempts (e.g., RS256 token re-signed as HS256 using the public key) — test with a disposable test-account token only.
3. Check for a reasonable expiration (`exp`) and that expired tokens are actually rejected server-side.
4. Review whether sensitive data (PII, secrets, roles used for authorization decisions without re-verification) is stored unencrypted in the payload.
5. If source access exists, review the signing secret/key management: is it hardcoded, checked into source control, or of insufficient length/entropy?
6. Verify revocation: can a logged-out or password-changed user's existing JWT still be used until natural expiry, and is that window acceptable?

## Decision Logic
- `alg: none` acceptance or successful algorithm-confusion is a critical finding.
- A hardcoded or short/weak signing secret is high severity even without demonstrating a successful forgery.
- Long-lived JWTs (e.g., >24h) with no revocation mechanism should be flagged as a design risk even if not immediately exploitable.

## Checklist
- [ ] Algorithm handling verified (no `alg: none`, no HS/RS confusion)
- [ ] Expiration presence and enforcement verified
- [ ] Payload reviewed for sensitive data exposure
- [ ] Signing secret/key management reviewed if source available
- [ ] Revocation behavior on logout/password-change reviewed



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
