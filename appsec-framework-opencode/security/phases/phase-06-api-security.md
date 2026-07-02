# Phase 6: API Security

## Purpose
Apply REST, GraphQL, and WebSocket-specific review on top of general findings, aligned to the OWASP API Security Top 10.

## Entry Criteria
Phase 2 recon has identified REST/GraphQL/WebSocket surfaces.

## Activities
- Confirm object- and function-level authorization on every API operation, not just the UI-facing ones.
- Check for mass assignment: does the API accept and persist fields the client should not be able to set (e.g., `role`, `isAdmin`, `balance`)?
- Review rate limiting and resource consumption controls on expensive or sensitive operations.
- For GraphQL: check introspection exposure in production, query depth/complexity limits, and field-level authorization.
- For WebSockets: verify authentication on connection/upgrade and per-message authorization, not just at handshake.
- Check for replay protection on state-changing requests (idempotency keys, nonces, timestamps).

- **Suggested tooling:** Postman/Insomnia for building a request collection from the OpenAPI spec, replayed through Burp Repeater for authorization/mass-assignment tests; Burp's InQL extension for GraphQL schema exploration.

## Exit Criteria
API-specific findings mapped to OWASP API Top 10 are documented.

## Related Skills
- `skills/api-security.md`
- `skills/graphql-security.md`
- `skills/websocket-security.md`
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
