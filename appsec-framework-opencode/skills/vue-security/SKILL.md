---
name: vue-security
description: Review Vue.js (Vue 2/3, Nuxt) frontend code for client-side vulnerabilities and insecure data-handling patterns.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Vue.js Security Review

## Purpose
Review Vue.js (Vue 2/3, Nuxt) frontend code for client-side vulnerabilities and insecure data-handling patterns.

## Scope
Vue-based SPAs and Nuxt applications.

## Inputs
Source access to components/templates where available; rendered HTML/JS otherwise.

## Outputs
Findings on unsafe HTML rendering, client-side secret exposure, and insecure state handling.

## Workflow
1. Search for `v-html` usage bound to user-controlled or server-returned data without sanitization — Vue's default text interpolation auto-escapes, but `v-html` does not.
2. Review whether any API keys, tokens, or secrets are bundled into client-side JS (checked via built bundle inspection).
3. For Nuxt SSR apps, review that server-only data (session secrets, internal API tokens) isn't inadvertently serialized into the hydration payload sent to the client.
4. Review client-side route guards to confirm they are UX-only and that the same authorization is enforced server-side (cross-reference `access-control.md`).
5. Check third-party script/CDN inclusion for subresource integrity (SRI) where scripts are loaded from external origins.

## Decision Logic
- Unsanitized `v-html` bound to user-influenced content is a stored/reflected XSS finding.
- Any secret found in the client bundle is treated as compromised and requires rotation, regardless of exploitability.

## Checklist
- [ ] `v-html` usage audited for unsanitized user-controlled content
- [ ] Client bundle checked for embedded secrets
- [ ] SSR hydration payload checked for server-only data leakage (if Nuxt)
- [ ] Client-side route guards confirmed to be UX-only, not the sole authorization mechanism



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
