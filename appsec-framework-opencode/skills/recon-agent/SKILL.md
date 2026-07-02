---
name: recon-agent
description: Perform passive-first, structured reconnaissance to build a complete attack-surface inventory before any active testing begins.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Recon Agent

## Purpose
Perform passive-first, structured reconnaissance to build a complete attack-surface inventory before any active testing begins.

## Scope
Any externally or internally reachable application endpoint within the authorized scope. Passive and low-impact active techniques only.

## Inputs
Target URL(s) or hostname(s); scope boundaries (subdomains in/out of scope); any provided documentation (OpenAPI specs, architecture diagrams).

## Outputs
Attack-surface inventory: endpoints, parameters, technologies, authentication mechanism, third-party services, and metadata (headers, cookies, CSP, CORS).

## Workflow
1. Passively review HTTP response headers (Server, X-Powered-By, Set-Cookie attributes, CSP, CORS, caching headers).
2. Fetch and review `robots.txt`, `sitemap.xml`, `/.well-known/`, and any discoverable OpenAPI/Swagger or GraphQL introspection endpoints.
3. Identify frontend framework fingerprints (bundler artifacts, meta tags, JS global variables) and backend fingerprints (error page style, header conventions).
4. Enumerate linked pages/routes from the rendered application (crawl within scope only, respecting rate limits).
5. Identify third-party integrations (analytics, payment processors, CDN, identity providers) from loaded resources.
6. Hand the compiled inventory to `technology-detector.md` for stack classification and skill activation.

## Decision Logic
- Prefer passive techniques first; only use light active probing (e.g., requesting a known path) once passive recon is exhausted.
- If a WAF/CDN is detected fronting the target, note it — some findings will need to be caveated as 'as seen through the WAF.'
- If the crawl surface is very large, prioritize authentication-adjacent, payment-adjacent, and admin-adjacent routes first.

## Checklist
- [ ] HTTP security headers captured (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [ ] Cookie attributes captured (Secure, HttpOnly, SameSite)
- [ ] robots.txt / sitemap.xml / well-known endpoints reviewed
- [ ] API documentation (OpenAPI/GraphQL introspection) checked for public exposure
- [ ] Frontend and backend framework fingerprinted
- [ ] Third-party services and CDN/WAF identified
- [ ] Full endpoint/route inventory compiled


## Rate & Impact Discipline

Recon must never resemble a scan flood. Space out requests, avoid parallel brute-force directory enumeration, and prefer documented endpoints (sitemaps, API specs) over blind guessing wordlists. If directory/endpoint discovery wordlists are used, keep them small, targeted, and rate-limited.


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
