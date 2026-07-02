---
name: react-security
description: Review React (and Next.js) frontend/SSR code for client-side vulnerabilities and insecure data-handling patterns.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# React Security Review

## Purpose
Review React (and Next.js) frontend/SSR code for client-side vulnerabilities and insecure data-handling patterns.

## Scope
React SPAs and Next.js applications (including server components/API routes).

## Inputs
Source access to components where available; rendered HTML/JS and network traffic otherwise.

## Outputs
Findings on unsafe HTML rendering, client-side secret exposure, and Next.js-specific SSR/API-route risks.

## Workflow
1. Search for `dangerouslySetInnerHTML` usage bound to user-controlled or server-returned data without sanitization.
2. Review whether environment variables exposed to the client (e.g., Next.js `NEXT_PUBLIC_*`) inadvertently include secrets that should stay server-side.
3. For Next.js, review API routes / server actions for the same authorization and input-validation rigor as any backend endpoint — these are real backend code, not just frontend glue.
4. Review `getServerSideProps`/server components for accidental inclusion of server-only data in the props sent to the client.
5. Check for open-redirect risk in any client-side or server-side redirect that uses a user-supplied URL/parameter.

## Decision Logic
- Unsanitized `dangerouslySetInnerHTML` with user-influenced content is an XSS finding.
- A secret exposed via a `NEXT_PUBLIC_*` variable (or equivalent) is treated as compromised and requires rotation.
- Next.js API routes/server actions missing authorization checks are treated exactly like any other backend API finding — apply `api-security.md` and `access-control.md`.

## Checklist
- [ ] `dangerouslySetInnerHTML` usage audited
- [ ] Client-exposed environment variables reviewed for secret leakage
- [ ] Next.js API routes/server actions reviewed with full backend rigor
- [ ] SSR props reviewed for server-only data leakage
- [ ] Redirect parameters checked for open-redirect risk



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
