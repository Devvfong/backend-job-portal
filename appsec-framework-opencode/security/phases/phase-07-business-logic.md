# Phase 7: Business Logic

## Purpose
Validate that workflows enforce real-world business rules server-side, independent of technical vulnerability classes.

## Entry Criteria
Test accounts and a non-production environment for the relevant workflows are available.

## Activities
- Test for race conditions in operations like coupon redemption, inventory decrement, or fund transfers (safe, low-volume concurrent requests in a test environment only).
- Test for price/quantity/parameter tampering in checkout and payment flows.
- Test for workflow-state bypass (e.g., approving your own request, skipping a required review step).
- Test for reuse of one-time tokens, invoices, or vouchers.

- **Suggested tooling:** Burp Repeater for step-skipping/sequence tests; Burp's "Send group in parallel" (single-packet) feature for minimal, safe race-condition checks in a test environment.

## Exit Criteria
Business-logic findings are documented with a safe, minimal reproduction.

## Related Skills
- `skills/business-logic.md`
- `skills/attack-playbooks.md`
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
