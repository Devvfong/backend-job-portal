---
name: laravel-security
description: Review Laravel applications for framework-specific misconfiguration in CSRF protection, middleware, templating, and ORM usage.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Laravel Security Review

## Purpose
Review Laravel applications for framework-specific misconfiguration in CSRF protection, middleware, templating, and ORM usage.

## Scope
Laravel (PHP) applications.

## Inputs
Source access to routes/controllers/middleware/Blade templates where available.

## Outputs
Findings on CSRF gaps, middleware misconfiguration, Blade template injection risk, and Eloquent ORM injection risk.

## Workflow
1. Verify CSRF protection (`VerifyCsrfToken` middleware) is applied to all state-changing routes and not disabled/excepted broadly.
2. Review middleware groups/route definitions to confirm `auth` and role/permission middleware are applied consistently to protected route groups.
3. Search Blade templates for `{!! !!}` (raw, unescaped output) bound to user-controlled data — Blade's default `{{ }}` auto-escapes, `{!! !!}` does not.
4. Review Eloquent usage for raw query construction (`DB::raw`, string-concatenated `whereRaw`) with unsanitized input, which bypasses parameter binding protections.
5. Review mass-assignment protection: `$fillable`/`$guarded` on models should prevent client-controlled fields like `is_admin` from being set via `Model::create($request->all())`.
6. Check `.env` and config caching for exposed `APP_DEBUG=true` in production (leaks stack traces and environment details).

## Decision Logic
- Blade raw-output XSS with user-controlled data is a standard XSS finding.
- Mass-assignment gaps that allow setting privilege/financial fields are high/critical severity.
- `APP_DEBUG=true` in production is at least medium severity due to information disclosure, higher if it reveals secrets.

## Checklist
- [ ] CSRF middleware coverage verified across state-changing routes
- [ ] Auth/permission middleware coverage verified across protected route groups
- [ ] Blade raw-output (`{!! !!}`) usage audited
- [ ] Eloquent raw-query usage audited for injection risk
- [ ] Mass-assignment protection (`$fillable`/`$guarded`) verified on models
- [ ] Production debug mode checked



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
