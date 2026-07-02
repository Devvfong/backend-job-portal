---
name: threat-intelligence
description: Given a specific (library, version) pair, determine whether current, relevant security advisories exist — without relying on a static internal CVE database that goes stale.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Threat Intelligence Lookup

## Purpose
Given a specific (library, version) pair, determine whether current, relevant security advisories exist — without relying on a static internal CVE database that goes stale.

## Scope
Called by `dependency-review.md` and `modern-framework-cves.md` for any identified component.

## Inputs
Library/framework name and version (or version range) from `dependency-review.md`.

## Outputs
A short list of applicable advisories (if any), each with severity, affected version range, and remediation version.

## Workflow
1. When external lookup capability is available, query current advisory sources (vendor security pages, GitHub Advisory Database, NVD) for the specific library and version.
2. Confirm the affected version range in the advisory actually includes the detected version before including it.
3. Summarize each applicable advisory in plain language: what the flaw is, how it could be triggered in this application's context, and the fixed version.
4. If no external lookup is available, state that explicitly in the report rather than presenting memorized/potentially stale advisory data as current.

## Decision Logic
- Never present a remembered CVE as 'current' without a live lookup — training data on advisories can be outdated, and new advisories are published constantly.
- If a component is past end-of-life/no longer maintained, flag this as a standalone finding even absent a specific matching CVE.

## Checklist
- [ ] Live advisory lookup attempted where tooling allows
- [ ] Version-range applicability double-checked before reporting
- [ ] End-of-life/unmaintained components flagged independently of specific CVEs
- [ ] Lookup limitations disclosed transparently when live lookup isn't available



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
