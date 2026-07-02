# Phase 9: Secure Code Review

## Purpose
Deep-dive on classic vulnerability classes at the code level: injection, SSRF, XSS, path traversal, unsafe deserialization, and cryptographic misuse.

## Entry Criteria
Source access exists (phase 5 complete) or strong black-box signal justifies targeted review.

## Activities
- Trace user-controlled input to injection sinks (SQL, NoSQL, command, LDAP, template).
- Identify SSRF risk in any code path that fetches a URL derived from user input.
- Review output-encoding coverage for stored/reflected/DOM-based XSS.
- Review file-path handling for traversal risk.
- Identify unsafe deserialization of user-controlled data.
- Review randomness sources used for tokens/keys (must be cryptographically secure, not `Math.random()`-style).

- **Suggested tooling:** Semgrep (or language-specific security linters) to generate leads for input-to-sink tracing; every hit manually verified before reporting.

## Exit Criteria
Vulnerability-class findings are documented with code references and safe reproduction.

## Related Skills
- `skills/code-security.md`
- `skills/secure-coding-guide.md`
- `skills/verification.md`
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
