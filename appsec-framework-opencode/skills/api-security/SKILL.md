---
name: api-security
description: Apply the OWASP API Security Top 10 to REST (and REST-adjacent) APIs, independent of the underlying backend framework.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# API Security Review

## Purpose
Apply the OWASP API Security Top 10 to REST (and REST-adjacent) APIs, independent of the underlying backend framework.

## Scope
Any REST-style API endpoint discovered during recon.

## Inputs
API documentation (OpenAPI spec) if available; endpoint inventory; test accounts.

## Outputs
API-specific findings: BOLA, mass assignment, resource consumption, function-level authorization, improper inventory.

## Workflow
1. Compare the live API surface against any published documentation — undocumented ('shadow') endpoints are a finding under Improper Inventory Management.
2. For each write operation, test mass assignment by submitting extra fields (e.g., `role`, `isAdmin`, `price`) not exposed in the documented request schema, using a disposable test record.
3. Verify pagination/filtering endpoints can't be abused to enumerate other users' data.
4. Check for rate limiting / resource consumption limits on expensive endpoints (search, export, bulk operations) without actually exhausting them.
5. Verify consistent authorization enforcement across all HTTP verbs for the same resource (e.g., GET is protected but DELETE is not).
6. Cross-reference with `access-control.md` for BOLA/function-level authorization findings specific to API routes.

## Decision Logic
- A mass-assignment field that changes privilege or financial state (role, balance, price) is high/critical severity.
- An undocumented endpoint exposing sensitive data is treated as a real finding, not just a documentation gap.
- Inconsistent verb-level authorization (protected GET, unprotected DELETE) is high severity.

## Checklist
- [ ] Live API surface diffed against documentation for shadow endpoints
- [ ] Mass assignment tested on write operations
- [ ] Pagination/filtering checked for cross-user data leakage
- [ ] Rate limiting presence verified on expensive operations
- [ ] Verb-level authorization consistency checked per resource



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
