---
name: secure-coding-guide
description: Translate each confirmed finding into concrete, framework-appropriate remediation code guidance that a developer can act on directly.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Secure Coding Guidance

## Purpose
Translate each confirmed finding into concrete, framework-appropriate remediation code guidance that a developer can act on directly.

## Scope
Invoked by any skill once a finding is confirmed, to produce the 'Remediation' and 'Secure Coding Recommendation' fields of the report.

## Inputs
A confirmed finding, its vulnerability class, and the detected technology stack.

## Outputs
Concrete remediation guidance: the specific API/pattern to use instead, framework-idiomatic where possible, plus a short rationale.

## Workflow
1. Match the finding's vulnerability class to the corresponding secure pattern for the detected framework (e.g., parameterized queries via the ORM's query builder, not raw string concatenation).
2. Prefer built-in framework/library protections over custom implementations (e.g., recommend the framework's CSRF middleware rather than a bespoke token scheme).
3. Keep remediation guidance actionable and scoped — a short code-pattern description or reference to the exact API to use, not a generic 'sanitize your input.'
4. Where a fix requires a version upgrade (from `dependency-review.md`), state the minimum safe version explicitly.

## Decision Logic
- Always prefer the least invasive fix that fully closes the gap (e.g., adding a missing authorization check) over a broad architectural rewrite recommendation, unless the finding is systemic.

## Checklist
- [ ] Remediation matched to the detected framework's idiomatic secure pattern
- [ ] Built-in framework protections preferred over custom schemes
- [ ] Guidance is concrete and actionable, not generic
- [ ] Version-upgrade remediations state the specific minimum safe version



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
