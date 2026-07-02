---
name: tooling
description: Map each phase and skill in this framework to the standard, industry-recognized tools professional AppSec teams actually use, so the methodology stays grounded in real-world workflows rather than abstract steps. Burp Suite is treated as the primary interception/testing platform, supplemented by othe
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Tooling Integration

## Purpose
Map each phase and skill in this framework to the standard, industry-recognized tools professional AppSec teams actually use, so the methodology stays grounded in real-world workflows rather than abstract steps. Burp Suite is treated as the primary interception/testing platform, supplemented by other common tools per task.

## Scope
Applies across all phases. This module doesn't perform testing itself — it tells each skill which tool and which specific feature of that tool is the conventional way to carry out its workflow.

## Inputs
The current phase/skill being executed; whether the assessor has Burp Suite (Community or Professional), an intercepting proxy alternative, or CLI-only access.

## Outputs
A tool recommendation (primary + fallback) attached to each workflow step, plus configuration notes (scope restriction, rate limiting) to keep tool usage inside the safety contract.

## Workflow
1. Before active testing begins, configure the chosen proxy/tool's scope to the authorized target(s) only — this is the single most important control for staying inside the safety contract.
2. Route all manual browser-driven testing through Burp Suite's Proxy (or OWASP ZAP if Burp is unavailable) so every request/response is captured for evidence and later reference.
3. Use Repeater (Burp) for manual, one-at-a-time verification of a suspected issue — this is the preferred way to confirm findings under the 'one proof per source' safety rule, since it sends a single crafted request rather than a batch.
4. Reserve Intruder / active bulk-testing features for low-volume, targeted payload sets against test/staging environments only, with request throttling enabled; never run unthrottled Intruder attacks against production.
5. Use Burp's passive Scanner findings as leads only — every passive/active scanner hit must still go through `verification.md` before being reported.
6. Use dedicated extensions for specific checks where available (e.g., an authorization-testing extension such as Autorize for automating the account-pair IDOR checks used in `access-control.md`; a JWT-editing extension for the manipulation checks in `jwt-review.md`).
7. Use Burp Collaborator (or an equivalent out-of-band interaction service) only for confirming blind/out-of-band SSRF in `code-security.md`'s SSRF checks — one interaction is sufficient evidence; do not repeat.

## Decision Logic
- Recon (Phase 2): passive proxy history review in Burp/ZAP, plus the target's own sitemap/OpenAPI/GraphQL introspection. Content-discovery tools (ffuf, gobuster, Burp's Content Discovery) are used with small, targeted wordlists and rate limiting — never large wordlists at high concurrency.
- Black-box (Phase 3) and Authentication Review: Burp Repeater for manual auth-flow testing (login, reset, MFA-bypass attempts); Burp Proxy's request history to check for rate-limit headers rather than actually exhausting a limit.
- Grey-box / Access Control (Phase 4): Burp Repeater with two authenticated sessions (one per test account) to swap object IDs; an authorization-automation extension (e.g., Autorize, AuthMatrix) is the conventional way to scale this across many endpoints without manually repeating each request.
- API Security (Phase 6): Postman or Insomnia for building/maintaining a request collection from an OpenAPI spec, then replaying suspect requests through Burp Repeater for manual authorization/mass-assignment tests. Burp's GraphQL extensions (e.g., InQL) for schema exploration and query-depth checks.
- Business Logic (Phase 7): Burp Repeater for sequential/step-skipping tests; if a race-condition check is warranted, Burp's built-in 'Send group in parallel' (single-packet) feature is the standard low-noise way to send a small number of near-simultaneous requests rather than a custom script.
- Secure Code Review (Phase 9): static analysis tools (e.g., Semgrep, ESLint security plugins, PHPStan security rules) for the initial input-to-sink trace, with every hit manually verified per `verification.md` before being reported — SAST output is a lead, not a finding.
- Dependency Review (Phase 8): `npm audit`/`yarn audit`, `composer audit`, `pip-audit`, or `osv-scanner` for enumerating known-vulnerable versions, cross-checked live per `threat-intelligence.md` rather than trusted as the final word.
- If Burp Suite is unavailable, OWASP ZAP is the direct substitute for proxy/repeater/passive-scan functionality throughout this framework.

## Checklist
- [ ] Proxy/tool scope restricted to authorized targets before any active testing
- [ ] All manual testing routed through an intercepting proxy (Burp or ZAP) for evidence capture
- [ ] Repeater (or equivalent single-request replay) used for finding confirmation, not bulk/automated attacks
- [ ] Any bulk/Intruder-style testing restricted to test/staging environments with throttling enabled
- [ ] Scanner/SAST output treated as leads and independently verified before reporting
- [ ] Out-of-band interaction tools (e.g., Collaborator) used minimally — one interaction per confirmed finding


## Standard Tool Stack Reference

| Purpose | Primary Tool | Fallback / Alternative |
|---|---|---|
| Intercepting proxy, manual request tampering | Burp Suite (Repeater, Proxy) | OWASP ZAP |
| Automated authorization/IDOR testing | Burp extension (Autorize, AuthMatrix) | Manual Repeater account-pair testing |
| API collection management & replay | Postman / Insomnia | Burp's own request collections |
| GraphQL exploration | Burp extension (InQL) | `graphql-voyager`, manual introspection queries |
| Content/endpoint discovery | Burp Content Discovery | ffuf, gobuster (small wordlist, rate-limited) |
| JWT manipulation | Burp extension (JWT Editor) | jwt.io (offline decode only, never paste live secrets into third-party sites) |
| Out-of-band / blind SSRF confirmation | Burp Collaborator | `interact.sh` or equivalent self-hosted OOB service |
| Static code analysis (lead generation) | Semgrep | Language-specific linters with security rule sets |
| Dependency/version auditing | `npm audit`, `composer audit`, `pip-audit` | `osv-scanner` |
| Race-condition timing tests | Burp "Send group in parallel" (single-packet) | Small, hand-written concurrent request script (test env only) |

This table is a starting point, not a mandate — any tool with equivalent capability is acceptable as long as it respects the safety contract (scoped, non-destructive, low-volume).


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
