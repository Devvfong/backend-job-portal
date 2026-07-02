# Phase 2: Recon

## Purpose
Build a complete, accurate picture of the technology stack and attack surface before deciding which framework-specific skills to activate.

## Entry Criteria
Phase 1 checklist exists.

## Activities
- Passive fingerprinting: HTTP headers, cookies, CSP, CORS policy, server banners, error pages.
- Identify frontend framework/build tooling, backend framework, database hints, reverse proxy/CDN.
- Enumerate discoverable entry points: robots.txt, sitemap.xml, OpenAPI/Swagger docs, GraphQL introspection, well-known endpoints.
- Identify authentication mechanism in use (session cookie, JWT, OAuth2/OIDC, third-party IdP).
- Catalog third-party integrations and cloud provider indicators.
- Hand results to `technology-detector.md` to select which downstream skills activate.

- **Suggested tooling:** Burp Suite Proxy (passive history review) or OWASP ZAP; light, rate-limited content discovery via Burp Content Discovery or ffuf/gobuster with a small wordlist.

## Exit Criteria
A complete attack-surface inventory (endpoints, technologies, auth mechanism, third-party services) is produced and the relevant framework-specific skills are activated for later phases.

## Related Skills
- `skills/recon-agent.md`
- `skills/technology-detector.md`
- `skills/attack-surface.md`
- `skills/tooling.md`

## Safe Testing Constraints

This module operates under the framework-wide safety contract:

- Authorized targets only. Never run against a system without explicit, documented permission from its owner.
- Non-destructive by default. Prefer read-only checks, passive fingerprinting, and single, reversible test requests over anything that mutates state.
- No denial-of-service. Never send high-volume traffic, fuzzers at scale, or resource-exhaustion payloads.
- No production data manipulation. Any proof-of-concept that could create, alter, or delete real records must run against a test account, sandbox tenant, or staging environment.
- One proof per finding. Once a vulnerability is confirmed with a single safe reproduction, stop — do not repeat the exploit or escalate further "to be sure."
- Credential handling. Never log, print, or persist secrets, tokens, or credentials encountered during testing; redact them in evidence and reports.
- Escalate, don't exploit. If a finding could lead to significant impact (e.g., full account takeover, RCE, mass data exposure), document the safe proof-of-concept and stop rather than pursuing full exploitation.
