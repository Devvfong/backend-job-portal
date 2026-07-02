---
name: nestjs-security
description: Review NestJS applications for framework-specific misconfiguration in guards, pipes, interceptors, and module boundaries.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# NestJS Security Review

## Purpose
Review NestJS applications for framework-specific misconfiguration in guards, pipes, interceptors, and module boundaries.

## Scope
NestJS applications (REST and/or GraphQL).

## Inputs
Source access to modules/controllers/guards where available.

## Outputs
Findings on missing/misapplied guards, validation-pipe gaps, and DTO over-exposure.

## Workflow
1. Verify `Guards` (e.g., `AuthGuard`, custom role guards) are applied at the controller or route level consistently — a guard applied globally can be accidentally bypassed by a route marked `@Public()` without justification.
2. Verify `ValidationPipe` (with `whitelist: true`) is enabled globally or per-DTO to strip unexpected properties — its absence is a direct path to mass assignment.
3. Review DTOs (Data Transfer Objects) returned to clients for over-exposure of internal fields (password hashes, internal flags) not stripped via serialization groups/interceptors.
4. If using NestJS GraphQL, cross-reference `graphql-security.md` for resolver-level authorization.
5. Review dependency injection scope for any service that inadvertently shares state across requests (e.g., a request-scoped value stored in a singleton).

## Decision Logic
- Missing global `ValidationPipe` with whitelist is treated as a mass-assignment risk across the whole API, not a single-endpoint finding.
- A guard-bypassing `@Public()` route that should have been protected is a critical function-level authorization gap.

## Checklist
- [ ] Guard coverage verified across controllers/routes
- [ ] `ValidationPipe` whitelist configuration verified
- [ ] DTO serialization reviewed for internal-field over-exposure
- [ ] GraphQL resolvers cross-checked against `graphql-security.md` if applicable
- [ ] Singleton-scoped services reviewed for cross-request state leakage



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
