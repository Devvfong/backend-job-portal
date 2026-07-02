# Phase 10: Reporting

## Purpose
Consolidate all findings from phases 1–9 into a single, professional, developer-actionable report.

## Entry Criteria
All prior phases relevant to this assessment's scope are complete.

## Activities
- Deduplicate findings that surfaced from multiple phases (e.g., an IDOR found in both grey-box and API review).
- Assign final severity/confidence/CVSS-informed ratings after cross-phase review.
- Write the executive summary for non-technical stakeholders and the technical summary for engineers.
- Produce a prioritized remediation roadmap ordered by risk and estimated fix effort.
- Run a final false-positive pass before delivery.

## Exit Criteria
Final report is delivered per the format in `skills/report-generator.md`.

## Related Skills
- `skills/report-generator.md`
- `skills/verification.md`

## Safe Testing Constraints

This module operates under the framework-wide safety contract:

- Authorized targets only. Never run against a system without explicit, documented permission from its owner.
- Non-destructive by default. Prefer read-only checks, passive fingerprinting, and single, reversible test requests over anything that mutates state.
- No denial-of-service. Never send high-volume traffic, fuzzers at scale, or resource-exhaustion payloads.
- No production data manipulation. Any proof-of-concept that could create, alter, or delete real records must run against a test account, sandbox tenant, or staging environment.
- One proof per finding. Once a vulnerability is confirmed with a single safe reproduction, stop — do not repeat the exploit or escalate further "to be sure."
- Credential handling. Never log, print, or persist secrets, tokens, or credentials encountered during testing; redact them in evidence and reports.
- Escalate, don't exploit. If a finding could lead to significant impact (e.g., full account takeover, RCE, mass data exposure), document the safe proof-of-concept and stop rather than pursuing full exploitation.
