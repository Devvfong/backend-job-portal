---
name: dependency-review
description: Identify all third-party libraries/frameworks in use and their versions, so relevant advisories can be surfaced without hardcoding a static, aging CVE list.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Dependency & Framework Version Review

## Purpose
Identify all third-party libraries/frameworks in use and their versions, so relevant advisories can be surfaced without hardcoding a static, aging CVE list.

## Scope
Any application with inspectable dependency manifests, lockfiles, or fingerprintable runtime artifacts.

## Inputs
package.json/package-lock.json, composer.json/composer.lock, requirements.txt/poetry.lock, go.mod, Gemfile.lock, or black-box version fingerprints (response headers, JS bundle comments, error pages).

## Outputs
A dependency inventory with versions and a filtered, version-matched risk summary — not a raw CVE dump.

## Workflow
1. Enumerate direct and, where feasible, key transitive dependencies from manifest/lockfiles.
2. Where source access is unavailable, infer likely library/framework and approximate version range from black-box fingerprints (with lower confidence, noted explicitly).
3. Hand the (library, version) pairs to `threat-intelligence.md` for advisory lookup.
4. Filter returned advisories to those that plausibly apply given how the library is actually used in this codebase (e.g., a vulnerable parsing function that is never called doesn't need to be reported as a live risk, but should still be noted for awareness).
5. Recommend concrete upgrade targets (specific version or version range) rather than a vague 'update your dependencies.'

## Decision Logic
- Prefer exact version identification (white-box) over inferred ranges (black-box); always state the confidence level.
- Do not report an advisory for a version range that doesn't match the detected version.
- Group advisories by actual exploitability in context, not just by CVSS score alone.

## Checklist
- [ ] Dependency inventory compiled with versions (or version ranges) and confidence noted
- [ ] Advisory lookup performed per (library, version) pair
- [ ] Advisories filtered for applicability to actual usage
- [ ] Concrete upgrade recommendations provided



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
