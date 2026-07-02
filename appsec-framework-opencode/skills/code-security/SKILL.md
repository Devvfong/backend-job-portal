---
name: code-security
description: Perform source-level review for classic vulnerability classes: injection, SSRF, XSS, path traversal, unsafe deserialization, and cryptographic misuse.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Secure Code Review

## Purpose
Perform source-level review for classic vulnerability classes: injection, SSRF, XSS, path traversal, unsafe deserialization, and cryptographic misuse.

## Scope
Any codebase with granted source access (Phase 5/9).

## Inputs
Source code repository access.

## Outputs
Findings with file/line references for each vulnerability class identified.

## Workflow
1. Trace all user-controlled input sources (request params/body/headers/cookies) to their sinks (database queries, shell commands, template rendering, file paths, deserialization calls).
2. Flag any sink reached by user input without parameterization/escaping/allowlisting appropriate to that sink type.
3. Identify SSRF risk: any outbound HTTP/fetch call whose target URL/host is derived, even partially, from user input.
4. Review cryptographic code: hashing algorithm choice for passwords (must be a slow, salted KDF like bcrypt/argon2/scrypt — not raw MD5/SHA1/SHA256), key storage, and randomness source for tokens (must be a CSPRNG).
5. Search for hardcoded secrets/credentials/API keys committed to source.
6. Review logging statements for accidental secret/PII logging.

## Decision Logic
- Any unsanitized user input reaching a SQL/NoSQL/command execution sink is critical severity regardless of perceived exploitation difficulty.
- Password hashing with a fast, unsalted, or reversible algorithm is high/critical severity.
- A hardcoded production secret found in source history is critical and requires immediate rotation, independent of the rest of the report's severity scale.

## Checklist
- [ ] Input-to-sink tracing performed for injection classes (SQL, NoSQL, command, template)
- [ ] SSRF-prone outbound requests identified
- [ ] Password hashing and token-randomness reviewed
- [ ] Hardcoded secrets searched for
- [ ] Logging reviewed for sensitive-data exposure



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
