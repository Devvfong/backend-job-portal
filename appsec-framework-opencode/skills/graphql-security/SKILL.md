---
name: graphql-security
description: Assess GraphQL-specific risks that REST-focused testing misses: introspection exposure, query complexity abuse, and field-level authorization gaps.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# GraphQL Security Review

## Purpose
Assess GraphQL-specific risks that REST-focused testing misses: introspection exposure, query complexity abuse, and field-level authorization gaps.

## Scope
Any discovered GraphQL endpoint.

## Inputs
GraphQL endpoint URL; schema (via introspection if enabled, or provided SDL).

## Outputs
Findings on introspection exposure, missing query depth/complexity limits, field-level authorization gaps, and batching abuse.

## Workflow
1. Check whether introspection is enabled in the production environment — it should generally be disabled or restricted outside of development.
2. Review the schema (if accessible) for fields that expose more data than the equivalent REST API would (a common GraphQL over-exposure pattern).
3. Test whether query depth/complexity limits exist by submitting one moderately nested query and observing behavior — do not send deeply recursive queries designed to exhaust resources.
4. Verify field-level authorization: does resolving a nested field (e.g., `user.paymentMethods`) re-check authorization, or does it inherit trust from the parent query incorrectly?
5. Check whether batched queries/mutations in a single request bypass per-request rate limiting.

## Decision Logic
- Introspection enabled in production is a low-to-medium finding on its own, but escalates if the exposed schema reveals sensitive internal fields.
- Missing field-level authorization on nested sensitive fields is high severity — treat it like BOLA.
- Do not attempt an actual complexity-based denial-of-service; a single moderately nested test query proving the absence of limits is sufficient evidence.

## Checklist
- [ ] Introspection exposure in production checked
- [ ] Schema reviewed for over-exposed fields
- [ ] Query depth/complexity limit presence verified with a single safe test query
- [ ] Field-level authorization on nested resolvers tested
- [ ] Batching abuse against rate limits checked



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
