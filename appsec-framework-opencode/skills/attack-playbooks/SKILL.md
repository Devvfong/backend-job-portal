---
name: attack-playbooks
description: Provide a library of safe, standardized test procedures ('playbooks') for common vulnerability classes, so other skills invoke a consistent, low-impact procedure rather than improvising potentially risky tests.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Attack Playbooks

## Purpose
Provide a library of safe, standardized test procedures ('playbooks') for common vulnerability classes, so other skills invoke a consistent, low-impact procedure rather than improvising potentially risky tests.

## Scope
Reference library used by `auth-review.md`, `access-control.md`, `api-security.md`, `business-logic.md`, and others.

## Inputs
A specific vulnerability class to test for, plus target context from the invoking skill.

## Outputs
A concrete, safe, step-by-step test procedure and the evidence format expected for a confirmed finding.

## Workflow
1. For each vulnerability class, define: the single safest request/sequence that would confirm the issue, the expected safe/unsafe response signatures, and how to stop immediately once confirmed.
2. Playbooks should default to read-only verification where possible (e.g., confirm IDOR via a GET request before ever considering a write test).
3. Where a write/state-changing test is unavoidable to confirm a finding, the playbook must specify using a disposable/test resource.

## Decision Logic
- If a playbook would require sending more than a handful of requests to confirm an issue, that's a signal that the test is drifting into brute-force territory — stop and escalate to the user instead of continuing.
- Playbooks never include payloads intended to cause a crash, hang, or resource exhaustion — the objective is always confirmation, not disruption.

## Checklist
- [ ] Playbook exists and was followed for each vulnerability class tested
- [ ] Read-only verification attempted before any write/state-changing test
- [ ] Any state-changing test used a disposable/test resource
- [ ] Testing stopped immediately once the finding was confirmed



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
