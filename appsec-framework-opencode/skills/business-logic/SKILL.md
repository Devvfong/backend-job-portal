---
name: business-logic
description: Identify flaws in application-specific workflows that don't fit standard technical vulnerability classes — abuse of legitimate functionality in unintended sequences or quantities.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Business Logic Review

## Purpose
Identify flaws in application-specific workflows that don't fit standard technical vulnerability classes — abuse of legitimate functionality in unintended sequences or quantities.

## Scope
Multi-step workflows: checkout/payment, approvals, coupon/voucher redemption, account provisioning, content moderation queues.

## Inputs
Access to the relevant workflow in a test/staging environment with realistic (non-production) data.

## Outputs
Findings on workflow-state bypass, race conditions, and value/quantity tampering.

## Workflow
1. Map the intended sequence of a workflow (e.g., cart → shipping → payment → confirmation) and identify which steps are enforced server-side versus assumed from client state.
2. Attempt to skip or reorder steps by calling a later-stage endpoint directly (e.g., hitting the 'confirm order' endpoint without a completed payment step) in a test environment.
3. Test for parameter tampering on price/quantity/discount fields submitted from the client.
4. Test for reuse of one-time codes (coupons, invite codes, referral bonuses) beyond their intended single use.
5. Where race conditions are plausible (e.g., redeeming a limited-use coupon), send a small number of near-simultaneous requests in a test environment only — not a high-volume race — to check for a missing atomic check.
6. **Cross-table status drift:** where a derived status (e.g., "overdue," "active," "paid") is computed from a different table than the one holding the authoritative payment/completion record, verify the two cannot go out of sync in a way that benefits the user — e.g., a record that should read overdue instead reads current because the status calculation source was changed or migrated and an edge case (partial payment, backdated entry, cancelled-then-reinstated record) was missed. This is especially worth targeted testing after any migration that moves a status calculation from one table/model to another.

## Decision Logic
- Any workflow-state bypass that results in receiving goods/services without proper payment or approval is high/critical severity.
- A demonstrated race condition allowing multiple redemptions of a single-use resource is high severity even if the demo used only two concurrent requests.

## Checklist
- [ ] Workflow step sequence mapped and server-side enforcement confirmed
- [ ] Step-skipping tested via direct endpoint calls
- [ ] Price/quantity/discount tampering tested
- [ ] One-time code/coupon reuse tested
- [ ] Race-condition check performed with minimal, safe concurrency in test environment
- [ ] Cross-table derived status (overdue/active/paid/etc.) checked for drift against its authoritative source, especially post-migration



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
