# Phase 8: Dependency Review

## Purpose
Identify all third-party frameworks and libraries in use, determine their versions, and surface only the advisories relevant to what's actually deployed.

## Entry Criteria
Dependency manifests or fingerprintable runtime artifacts are accessible.

## Activities
- Enumerate dependencies from lockfiles/manifests (package.json/package-lock.json, composer.lock, requirements.txt, go.mod, etc.) or from detected runtime fingerprints in black-box mode.
- Determine exact or best-estimate versions in use.
- Where external lookup is available, cross-reference versions against current vendor advisories and public vulnerability databases — do not rely on a static, potentially outdated internal CVE list.
- Filter out advisories that don't apply to the way the library is actually used (e.g., a vulnerable function that is never called).
- Recommend specific upgrade paths or mitigations.

- **Suggested tooling:** `npm audit` / `composer audit` / `pip-audit` / `osv-scanner` for enumeration, cross-checked live per `threat-intelligence.md`.

## Exit Criteria
A dependency risk summary with only relevant, version-matched findings is produced.

## Related Skills
- `skills/dependency-review.md`
- `skills/threat-intelligence.md`
- `skills/modern-framework-cves.md`
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
