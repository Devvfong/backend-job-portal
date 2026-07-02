---
name: verification
description: Independently re-check every finding before it is included in the final report, acting as the framework's internal quality gate against false positives and unsubstantiated claims.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Finding Verification

## Purpose
Independently re-check every finding before it is included in the final report, acting as the framework's internal quality gate against false positives and unsubstantiated claims.

## Scope
Every finding produced by any skill in this framework, prior to Phase 10 reporting.

## Inputs
The full findings ledger from all executed phases/skills.

## Outputs
A verified findings list, with any unconfirmed items downgraded to 'Unconfirmed / Needs Manual Validation' or removed with a rationale.

## Workflow
1. For each finding, confirm a concrete reproduction step exists and is described precisely enough that someone else could repeat it.
2. Re-check the severity/confidence rating against the actual evidence — downgrade if the evidence is weaker than the stated severity implies.
3. Check for duplicate findings reported by multiple skills/phases and merge them.
4. Confirm no finding includes exact secrets/credentials in its evidence (redact before finalizing).
5. Confirm every finding has an OWASP and CWE mapping before it's passed to `report-generator.md`.

## Decision Logic
- A finding without a reproducible step is downgraded to 'Unconfirmed' rather than dropped silently — this preserves the lead for future manual follow-up.
- When two findings describe the same root cause via different entry points, merge them into one finding with multiple affected locations rather than reporting duplicates.

## Checklist
- [ ] Every finding has a concrete reproduction step
- [ ] Severity/confidence re-validated against evidence
- [ ] Duplicate findings merged
- [ ] Secrets redacted from all evidence
- [ ] OWASP + CWE mapping present on every finding



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
