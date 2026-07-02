# Phase 4: Greybox

## Purpose
With limited internal knowledge (API docs, multiple test accounts, or architecture diagrams), validate authorization boundaries and business logic that black-box testing alone cannot reach.

## Entry Criteria
At least two distinct-privilege test accounts are available in a non-production environment.

## Activities
- Create/obtain at least two accounts of differing privilege levels for comparison testing.
- Test for IDOR/BOLA by swapping object identifiers between accounts on read/update/delete operations.
- Test function-level authorization: attempt to reach admin/privileged endpoints from a low-privilege session.
- Validate role separation is enforced server-side, not just hidden in the UI.
- Review multi-step workflows for logic bypass (e.g., skipping a payment step, replaying a completed action).

- **Suggested tooling:** Burp Repeater with two authenticated sessions for ID-substitution tests; an authorization-automation extension (e.g., Autorize, AuthMatrix) to scale IDOR/function-level checks across many endpoints.

## Exit Criteria
Authorization and business-logic findings are documented with account-pair reproduction steps.

## Related Skills
- `skills/access-control.md`
- `skills/business-logic.md`
- `skills/tooling.md`

## Safe Testing Constraints

This module operates under the framework-wide safety contract:

- Authorized targets only. Never run against a system without explicit, documented permission from its owner.
- Non-destructive by default. Prefer read-only checks, passive fingerprinting, and single, reversible test requests over anything that mutates state.
- No denial-of-service. Never send high-volume traffic, fuzzers at scale, or resource-exhaustion payloads.
- No production data manipulation. Any proof-of-concept that could create, alter, or delete real records must run against a test account, sandbox tenant, or staging environment.
- One proof per finding. Once a vulnerability is confirmed with a single safe reproduction, stop — do not repeat the exploit or escalate further "to be sure."
- Credential handling. Never log, print, or persist secrets, tokens, or credentials encountered during testing; redact them in evidence and reports.
- Escalate, don't exploit. If a finding could lead to significant impact (e.g., full account takeover, RCE, mass data exposure), document the safe proof-of-concept and stop rather than pursuing full exploitation.
