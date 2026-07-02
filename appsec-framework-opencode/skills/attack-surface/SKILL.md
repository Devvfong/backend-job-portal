---
name: attack-surface
description: Consolidate recon and technology-detection output into a single, prioritized attack-surface map that downstream phases test against.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Attack Surface Mapping

## Purpose
Consolidate recon and technology-detection output into a single, prioritized attack-surface map that downstream phases test against.

## Scope
Applies once initial recon and technology detection are complete.

## Inputs
Recon inventory; technology profile; any provided API documentation.

## Outputs
A prioritized list of entry points (authentication flows, APIs, file upload, admin panels, payment flows, webhooks) ranked by sensitivity and likely impact.

## Workflow
1. Merge the endpoint inventory with the technology profile to tag each entry point with relevant risk categories (e.g., 'auth-related', 'payment-related', 'file-handling').
2. Rank entry points by potential impact: authentication, authorization, payment, and data-export endpoints first; static/marketing content last.
3. Flag entry points that accept file uploads, redirects, or user-supplied URLs (SSRF-relevant) for priority review in later phases.
4. Identify any exposed internal/admin/debug endpoints that should not be externally reachable.

## Decision Logic
- Treat any endpoint touching money, PII, credentials, or privilege changes as high-priority regardless of how it was discovered.
- Treat undocumented endpoints found only via crawling (not in official docs) as worth extra scrutiny — they're more likely to be missing review.

## Checklist
- [ ] All entry points tagged by risk category
- [ ] High-impact entry points (auth, payment, admin, PII) explicitly flagged
- [ ] File-upload and URL-fetching endpoints flagged for SSRF/upload review
- [ ] Exposed debug/admin endpoints flagged if found



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
