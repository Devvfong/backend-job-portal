---
name: report-generator
description: Consolidate all verified findings into a single, professional penetration-testing report suitable for developers, security engineers, and stakeholders.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Report Generator

## Purpose
Consolidate all verified findings into a single, professional penetration-testing report suitable for developers, security engineers, and stakeholders.

## Scope
Final step of every assessment (Phase 10).

## Inputs
Verified findings list from `verification.md`; assessment scope/authorization notes; the target-specific checklist from `owasp-review.md`.

## Outputs
A complete report document (see structure below).

## Workflow
1. Write an Executive Summary: 3-5 sentences, non-technical, stating overall risk posture and the most critical issues.
2. Write a Technical Summary: stack overview, phases executed, and methodology notes (including any scope limitations, e.g., no source access).
3. List every finding using the standard finding format (see Reporting Contract).
4. Produce a Prioritized Remediation Roadmap: order findings by risk × fix effort, grouping quick wins separately from larger structural fixes.
5. Attach the completed checklist from `owasp-review.md` showing coverage and any explicitly out-of-scope items.
6. Include a Developer Checklist: a condensed, actionable punch-list distinct from the full findings detail.

## Decision Logic
- Order findings by severity first, then by ease of exploitation within the same severity tier.
- Never omit a scope limitation (e.g., 'no source access' or 'introspection was already disabled, so schema could not be fully reviewed') — transparency about coverage gaps is part of professional reporting.

## Checklist
- [ ] Executive Summary written for non-technical stakeholders
- [ ] Technical Summary includes methodology and scope limitations
- [ ] Every finding uses the standard format with full field set
- [ ] Prioritized remediation roadmap included
- [ ] Checklist coverage attached
- [ ] Developer checklist included


## Standard Finding Format

```
### [Severity] Finding Title

- Confidence: High / Medium / Low
- OWASP Mapping:
- CWE:
- Affected Component / Endpoint:
- Evidence: (redacted of secrets)
- Reproduction Steps (safe):
- Business Impact:
- Technical Impact:
- Likelihood:
- Remediation:
- Secure Coding Recommendation:
- Verification Steps (for re-test after fix):
- References:
```


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
