---
name: owasp-review
description: Expand the current OWASP Top 10, API Security Top 10, ASVS, and WSTG into a target-specific verification checklist, and track completion of that checklist across the assessment.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# OWASP Review

## Purpose
Expand the current OWASP Top 10, API Security Top 10, ASVS, and WSTG into a target-specific verification checklist, and track completion of that checklist across the assessment.

## Scope
Runs at the start of the assessment (Phase 1) and is referenced throughout as the source of truth for coverage.

## Inputs
Target type (web app, API, SPA, mobile backend); technology profile once available.

## Outputs
A target-specific checklist derived from `checklist.md`, with inapplicable items removed and an ASVS verification level assigned.

## Workflow
1. Determine which OWASP guides apply based on target type (e.g., API Security Top 10 is central for an API-only backend; WSTG's client-side testing section is central for an SPA).
2. Assign an ASVS verification level (L1 baseline, L2 standard, L3 high-assurance) based on data sensitivity and threat model.
3. Remove checklist items that are structurally inapplicable (e.g., no file-upload feature exists) and note why.
4. Track checklist completion as other phases produce results, flagging any item that could not be verified due to access constraints.

## Decision Logic
- Default to ASVS L2 unless the target handles regulated data (health, financial, government) or the user requests L3, or is a low-stakes internal tool where L1 suffices.
- Never silently drop a checklist item — every removal must be justified in the report's scope notes.

## Checklist
- [ ] Target type classified and matching OWASP guides selected
- [ ] ASVS verification level assigned and justified
- [ ] Target-specific checklist derived from the master checklist
- [ ] Checklist completion tracked through to Phase 10



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
