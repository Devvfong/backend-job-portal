# Phase 5: Whitebox

## Purpose
Review source code and architecture directly, where access is available, to catch issues black-box/grey-box testing cannot surface.

## Entry Criteria
Source code access has been granted for this assessment.

## Activities
- Map routing, middleware order, and where authentication/authorization checks are applied.
- Review input validation and output encoding patterns across controllers/handlers.
- Review cryptographic usage: hashing algorithms, key management, randomness sources.
- Search for hardcoded secrets, credentials, or tokens in source and configuration files.
- Review logging for sensitive-data exposure and for sufficiency (are auth events, access failures logged?).

## Exit Criteria
Code-level findings are documented with file/line references and handed to phase 9 for deep secure-code review.

## Related Skills
- `skills/code-security.md`
- `skills/secure-coding-guide.md`

## Safe Testing Constraints

This module operates under the framework-wide safety contract:

- Authorized targets only. Never run against a system without explicit, documented permission from its owner.
- Non-destructive by default. Prefer read-only checks, passive fingerprinting, and single, reversible test requests over anything that mutates state.
- No denial-of-service. Never send high-volume traffic, fuzzers at scale, or resource-exhaustion payloads.
- No production data manipulation. Any proof-of-concept that could create, alter, or delete real records must run against a test account, sandbox tenant, or staging environment.
- One proof per finding. Once a vulnerability is confirmed with a single safe reproduction, stop — do not repeat the exploit or escalate further "to be sure."
- Credential handling. Never log, print, or persist secrets, tokens, or credentials encountered during testing; redact them in evidence and reports.
- Escalate, don't exploit. If a finding could lead to significant impact (e.g., full account takeover, RCE, mass data exposure), document the safe proof-of-concept and stop rather than pursuing full exploitation.
