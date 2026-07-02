---
name: websocket-security
description: Assess authentication and authorization on WebSocket connections and the messages exchanged over them.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# WebSocket Security Review

## Purpose
Assess authentication and authorization on WebSocket connections and the messages exchanged over them.

## Scope
Any WebSocket/real-time channel discovered during recon.

## Inputs
WebSocket endpoint URL; sample connection handshake; test accounts.

## Outputs
Findings on missing origin validation, missing per-connection authentication, and missing per-message authorization.

## Workflow
1. Verify the WebSocket handshake validates `Origin` to prevent cross-site WebSocket hijacking.
2. Verify the connection itself requires authentication (token/cookie) rather than trusting any client that can reach the endpoint.
3. Once connected, verify that each message/subscription is authorized individually — a connection authenticated as User A should not be able to subscribe to or send messages on behalf of User B's channel/room by ID substitution.
4. Check whether sensitive data is broadcast to a wider audience (e.g., a shared room) than intended.

## Decision Logic
- Missing Origin validation combined with an authenticated-by-cookie connection is a cross-site WebSocket hijacking risk — high severity.
- Per-message authorization gaps (channel/room ID substitution) are treated the same as BOLA — high/critical depending on data sensitivity.

## Checklist
- [ ] Origin validation on handshake verified
- [ ] Connection-level authentication verified
- [ ] Per-message/per-channel authorization tested via ID substitution
- [ ] Broadcast scope reviewed for over-exposure



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
