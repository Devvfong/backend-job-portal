---
name: session-security
description: Assess cookie-based and server-side session management for fixation, hijacking, and insecure configuration risks.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Session Security

## Purpose
Assess cookie-based and server-side session management for fixation, hijacking, and insecure configuration risks.

## Scope
Any application using server-side sessions or session cookies (as opposed to, or alongside, JWTs).

## Inputs
Sample session cookies from a test account; recon data on cookie attributes.

## Outputs
Findings on session fixation, missing cookie flags, predictable session identifiers, and improper session invalidation.

## Workflow
1. Verify session cookies carry `Secure`, `HttpOnly`, and an appropriate `SameSite` attribute.
2. Check whether the session identifier changes after login (protection against session fixation) — a pre-login and post-login ID should differ.
3. Assess session ID entropy/predictability from samples (should be long, random, and generated server-side).
4. Verify that logout, password change, and privilege change invalidate the prior session server-side.
5. Check for concurrent-session handling policy where relevant (e.g., banking apps often limit concurrent sessions).

## Decision Logic
- Missing `HttpOnly` on a session cookie is high severity due to XSS-driven session theft risk.
- Session ID reuse across privilege levels (not rotated after login) is a session-fixation finding.
- Predictable/sequential session identifiers are critical severity.

## Checklist
- [ ] Cookie flags (Secure, HttpOnly, SameSite) verified
- [ ] Session ID rotation after login verified
- [ ] Session ID entropy assessed
- [ ] Session invalidation on logout/password-change verified



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
