---
name: access-control
description: Validate that authorization is enforced server-side across roles and object ownership boundaries — the largest category in the OWASP Top 10.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Access Control / Authorization Review

## Purpose
Validate that authorization is enforced server-side across roles and object ownership boundaries — the largest category in the OWASP Top 10.

## Scope
Any multi-user or multi-role application; any API where objects are addressed by ID.

## Inputs
At least two test accounts of differing privilege levels or ownership of different resources.

## Outputs
Findings on IDOR/BOLA, vertical privilege escalation, and function-level authorization gaps.

## Workflow
1. Enumerate object-referencing endpoints (e.g., `/api/orders/{id}`, `/api/users/{id}/profile`).
2. As User A, note IDs of A's own objects. As User B, attempt to read/update/delete User A's objects by ID substitution.
3. As a low-privilege user, attempt to directly call endpoints intended for admin/privileged roles (via direct URL/API call, not just UI navigation).
4. Check whether authorization decisions are made server-side on every request, or only enforced by hiding UI elements client-side.
5. For nested/related resources, verify authorization is checked at every level (e.g., can User B access a comment belonging to User A's private post by comment ID alone?).
6. **Two-role trust boundary check (e.g., front-desk vs. admin/manager roles):** where a system has a narrow set of internal roles rather than many tenants, enumerate the *field-level* split within a shared resource, not just endpoint access. A front-desk/operational role may legitimately read and update a record (e.g., an enrollment) but should not be able to set fields reserved for the privileged role (pricing overrides, discounts, refund approval, status overrides). Test by submitting those fields in an update request as the lower-privilege role even if the UI never exposes them.
7. Confirm privileged-only aggregate/reporting endpoints (dashboards, exports, cross-record summaries) reject the lower-privilege role server-side, not just omit the nav link.

## Decision Logic
- Any successful cross-account read of another user's private data via ID substitution is at least high severity; write/delete access is critical.
- UI-only enforcement (backend accepts the privileged request regardless of role) is a full function-level authorization bypass — critical severity.
- Rate the finding by the sensitivity of the exposed data/action, not just by the technique used.

## Checklist
- [ ] Object-level authorization (IDOR/BOLA) tested across at least two accounts
- [ ] Function-level authorization tested via direct endpoint access
- [ ] Server-side enforcement confirmed independent of UI restrictions
- [ ] Nested/related-resource authorization checked
- [ ] Field-level write authorization tested for shared records edited by multiple roles (privileged-only fields rejected from lower-privilege role)
- [ ] Privileged-only aggregate/reporting/export endpoints tested for server-side role enforcement



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
