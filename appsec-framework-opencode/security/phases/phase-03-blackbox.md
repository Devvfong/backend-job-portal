# Phase 3: Blackbox

## Purpose
Test the application as an external, unauthenticated or low-privilege user would — no source code assumed.

## Entry Criteria
Phase 2 attack surface inventory exists.

## Activities
- Enumerate visible endpoints, forms, and parameters discovered in recon.
- Analyze authentication flows: login, registration, password reset, MFA, logout, and session issuance.
- Review file upload handling for type/size/content validation (safe test files only).
- Send minimal, safe boundary-value and malformed inputs to observe error handling and information leakage — never fuzzing at volume.
- Check for verbose error messages, stack traces, and debug endpoints exposed externally.

- **Suggested tooling:** Burp Repeater for manual auth-flow and boundary-value testing; Burp Proxy history to check for rate-limit headers without exhausting them.

## Exit Criteria
Findings related to externally observable weaknesses are documented and handed to phase 6/9 for deeper analysis where relevant.

## Related Skills
- `skills/auth-review.md`
- `skills/session-security.md`
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
