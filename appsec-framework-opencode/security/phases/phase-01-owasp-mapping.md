# Phase 1: OWASP Mapping

## Purpose
Establish the applicable verification surface for this specific target before any testing begins, using the latest OWASP Top 10, API Security Top 10, ASVS, and WSTG.

## Entry Criteria
Written authorization/scope confirmation exists. Target URL(s), repository access (if any), and environment (prod/staging/test) are identified.

## Activities
- Determine application type (traditional web app, SPA, API-only backend, mobile backend, etc.) to scope which OWASP guides apply.
- Expand `checklist.md` into a target-specific checklist, removing items that are structurally inapplicable (e.g., no file upload feature exists).
- Set the ASVS verification level (1, 2, or 3) based on the sensitivity of the data/functionality in scope.
- Record assumptions about scope, environment, and authorization for the audit trail.

## Exit Criteria
A target-specific checklist exists and is handed to `pentest-orchestrator.md` to drive phase 2 onward.

## Related Skills
- `skills/pentest-orchestrator.md`
- `skills/owasp-review.md`

## Safe Testing Constraints

This module operates under the framework-wide safety contract:

- Authorized targets only. Never run against a system without explicit, documented permission from its owner.
- Non-destructive by default. Prefer read-only checks, passive fingerprinting, and single, reversible test requests over anything that mutates state.
- No denial-of-service. Never send high-volume traffic, fuzzers at scale, or resource-exhaustion payloads.
- No production data manipulation. Any proof-of-concept that could create, alter, or delete real records must run against a test account, sandbox tenant, or staging environment.
- One proof per finding. Once a vulnerability is confirmed with a single safe reproduction, stop — do not repeat the exploit or escalate further "to be sure."
- Credential handling. Never log, print, or persist secrets, tokens, or credentials encountered during testing; redact them in evidence and reports.
- Escalate, don't exploit. If a finding could lead to significant impact (e.g., full account takeover, RCE, mass data exposure), document the safe proof-of-concept and stop rather than pursuing full exploitation.
