---
name: audit-log-integrity
description: Validate that audit/activity logs covering sensitive tables (payments, invoices, enrollments, expenses, budgets, or equivalent financial/record-of-truth tables) are complete, tamper-resistant, and trustworthy as evidence — not just present.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Audit Log Integrity Review

## Purpose
Validate that audit/activity logs covering sensitive tables (payments, invoices, enrollments, expenses, budgets, or equivalent financial/record-of-truth tables) are complete, tamper-resistant, and trustworthy as evidence — not just present.

## Scope
Any application that maintains an audit trail for financial, access-control, or compliance-relevant actions, especially where multiple roles can write to the underlying tables.

## Inputs
Source access to the audit-log write path (model/service layer) and at least two accounts of differing privilege for cross-checking coverage.

## Outputs
Findings on missing audit coverage, client-controlled audit fields, and direct/alternate write paths that bypass logging.

## Workflow
1. Enumerate every mutating endpoint on the tables designated as audit-scoped. Cross-reference each one against the audit-log write path to confirm it actually triggers a log entry — not just the "primary" create/update/delete route, but bulk-update, admin-override, and background/cron-triggered mutations too.
2. Verify audit-log fields that establish *who/when/what* (actor ID, timestamp, action type, before/after values) are derived server-side from the authenticated session and system clock — never accepted from client-submitted request body or query params.
3. Check whether any authenticated role (including the role that owns the underlying record) can write, update, or delete rows in the audit-log table itself, directly or via a generic/reusable update endpoint. Audit tables should be append-only from the application's perspective — insert-only privilege at the DB/service layer.
4. If soft-delete or "restored records" functionality exists, confirm that restoring a record also produces its own audit entry rather than silently reintroducing a record with no trace of the restoration.
5. Spot-check that a sequence of related mutations (e.g., an enrollment edited, then its overdue status recalculated by a scheduled job) produces a coherent, ordered trail rather than out-of-order or duplicate entries that would undermine trust in the log during an investigation.

## Decision Logic
- Any client-controllable actor/timestamp field in an audit entry is high severity — it allows an attacker or insider to forge attribution.
- Any endpoint that mutates an audit-scoped table without producing a corresponding log entry is high severity, more so if it's a privileged/admin-only or bulk endpoint (larger blast radius per silent action).
- Write/delete access to the audit table from any application role (not just direct DB access) is critical — it defeats the purpose of the control entirely.

## Checklist
- [ ] Every mutating endpoint on audit-scoped tables confirmed to produce a log entry, including bulk/admin/scheduled-job paths
- [ ] Actor ID and timestamp confirmed server-derived, not client-supplied
- [ ] Audit table confirmed insert-only from the application's perspective (no update/delete path reachable by any role)
- [ ] Restore/undo flows confirmed to generate their own audit entry
- [ ] Related-mutation sequences spot-checked for coherent ordering



## False-Positive Reduction

- Confirm the issue is reachable from an actual entry point, not just present in dead code.
- Reproduce with a minimal, isolated request/input before recording a finding.
- Distinguish framework-provided mitigations (e.g., DB-level triggers or constraints that already enforce append-only behavior) that may neutralize the pattern even if application code doesn't explicitly forbid it.
- Where automated scanners or static analysis contributed the signal, manually verify before including it in the report.
- Note any finding that could not be independently confirmed as "Unconfirmed / Needs Manual Validation" rather than omitting or overstating it.

## Safe Testing Constraints

This module operates under the framework-wide safety contract:

- Authorized targets only. Never run against a system without explicit, documented permission from its owner.
- Non-destructive by default. Prefer read-only checks and code review over live mutation testing.
- No production data manipulation. Any proof-of-concept that could create, alter, or delete real records — including audit records — must run against a test account, sandbox tenant, or staging environment.
- One proof per finding. Once a vulnerability is confirmed with a single safe reproduction, stop.
- Credential handling. Never log, print, or persist secrets, tokens, or credentials encountered during testing; redact them in evidence and reports.

## Reporting Contract

Every finding produced by this module must be handed to `report-generator.md` with, at minimum:

- Title, Severity, Confidence
- OWASP mapping (A09 Security Logging and Monitoring Failures) and CWE ID
- Affected component / endpoint / file
- Evidence (redacted of secrets)
- Safe reproduction steps
- Business impact and technical impact
- Remediation guidance and secure-coding recommendation
- Verification steps for re-testing after a fix

## References
- OWASP Top 10 (latest) — A09 Security Logging and Monitoring Failures
- OWASP Application Security Verification Standard (ASVS) — V7 Error Handling and Logging
- OWASP Web Security Testing Guide (WSTG)
- CWE (MITRE Common Weakness Enumeration)
