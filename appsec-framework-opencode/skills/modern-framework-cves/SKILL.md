---
name: modern-framework-cves
description: Maintain awareness of advisory patterns specific to the modern frameworks this framework supports (Vue, React/Next.js, Express, NestJS, Laravel), feeding `threat-intelligence.md` with framework-aware context.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Modern Framework Advisory Tracking

## Purpose
Maintain awareness of advisory patterns specific to the modern frameworks this framework supports (Vue, React/Next.js, Express, NestJS, Laravel), feeding `threat-intelligence.md` with framework-aware context.

## Scope
The specific frameworks enumerated in `README.md`'s supported ecosystem list.

## Inputs
Detected framework + version from `technology-detector.md`.

## Outputs
Framework-aware context to sharpen `threat-intelligence.md` lookups (e.g., known advisory categories for that framework family).

## Workflow
1. For the detected framework, note historically common advisory categories for that ecosystem (e.g., Next.js SSRF/cache-poisoning-class issues, Laravel deserialization issues in specific package combinations, Express prototype-pollution-class issues in body-parsing middleware) purely as *categories to check for*, not as a static vulnerability list to report from memory.
2. Pass this context to `threat-intelligence.md` to make the live lookup more targeted.
3. Never report a specific finding here without it being confirmed by a live advisory lookup or by direct code/behavior verification.

## Decision Logic
- This module never generates a finding on its own — it only sharpens where `threat-intelligence.md` and `code-security.md` look.

## Checklist
- [ ] Framework-specific advisory categories identified for the detected stack
- [ ] Context handed to `threat-intelligence.md` for a targeted live lookup
- [ ] No finding reported here without independent confirmation



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
