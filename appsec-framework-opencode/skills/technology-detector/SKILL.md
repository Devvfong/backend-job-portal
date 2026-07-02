---
name: technology-detector
description: Classify the frontend, backend, database, infrastructure, and auth stack from recon signals, and drive which framework-specific skills the orchestrator activates.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Technology Detector

## Purpose
Classify the frontend, backend, database, infrastructure, and auth stack from recon signals, and drive which framework-specific skills the orchestrator activates.

## Scope
Any target where recon output (headers, page source, error messages, manifest files) is available.

## Inputs
Recon inventory from `recon-agent.md`; optionally, repository contents (package.json, composer.json, requirements.txt, go.mod) if source access exists.

## Outputs
A structured technology profile: frontend framework + version, backend framework + version, database hints, infra/hosting indicators, auth mechanism, and the resulting list of skills to activate.

## Workflow
1. If source access exists, read manifest/lockfiles directly for authoritative framework and version data (highest confidence).
2. If black-box only, infer from build artifacts (e.g., Vue devtools hook, React fiber markers, Next.js `_next/` paths, Laravel's `XSRF-TOKEN` cookie naming), response headers, and error page signatures.
3. Cross-check multiple independent signals before committing to a technology identification — a single header is weak evidence, three consistent signals is strong evidence.
4. Classify auth mechanism: session cookie, JWT (check header/cookie structure), OAuth2/OIDC redirect flow, or third-party IdP (Auth0/Clerk/Firebase/Keycloak) based on redirect URLs and token shapes.
5. Output the technology profile and the corresponding skill-activation list to the orchestrator.

## Decision Logic
- Manifest/lockfile evidence (white-box) always overrides inferred black-box evidence when both are available.
- Version strings should be treated as a range if exact version can't be confirmed (e.g., 'Express 4.x, minor version unknown') rather than guessed precisely.
- Do not guess a technology from a single weak signal (e.g., a generic cookie name); require corroboration.

## Checklist
- [ ] Frontend framework identified (or explicitly 'unknown')
- [ ] Backend framework identified (or explicitly 'unknown')
- [ ] Database technology inferred where possible
- [ ] Hosting/infra indicators captured (CDN, cloud provider, container orchestration hints)
- [ ] Auth mechanism classified
- [ ] Skill-activation list produced for the orchestrator



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
