# Methodology

## Philosophy

This framework treats application security assessment as an evidence-driven, reproducible engineering discipline — not a checklist-ticking exercise. Every module in `skills/` and every phase in `phases/` shares the same operating principles:

1. **Authorization first.** Every assessment assumes the target is owned by the user or explicitly authorized for testing. No module in this framework should be pointed at a system without that authorization.
2. **Evidence over assumption.** A finding is not real until it has been reproduced with a concrete, minimal, safe proof. Static-analysis hits, scanner output, and pattern matches are *leads*, not findings, until verified.
3. **Non-destructive by default.** Testing must never degrade availability, corrupt data, or disrupt production traffic. See the safety contract below.
4. **Latest standards, dynamically applied.** Use the current OWASP Top 10, OWASP API Security Top 10, ASVS, and WSTG as the backbone, adapted to the technologies actually detected — never a generic, one-size-fits-all checklist run blindly against every stack.
5. **No CVE hoarding.** Don't dump lists of historical CVEs. Detect actual software + version in use, and only surface advisories relevant to what's really deployed.
6. **Traceable reporting.** Every finding maps to OWASP and CWE identifiers, includes reproduction steps, and ends with concrete remediation — so a developer can act on it without further back-and-forth.

## Safety Contract (applies to every module in this repository)

- Authorized targets only.
- No destructive actions, denial-of-service, resource exhaustion, or deliberate service disruption.
- Prefer passive reconnaissance and read-only checks before any active testing.
- Any active test that could mutate data runs against a test account or staging/sandbox environment, never live production data, unless the user has explicitly confirmed it is safe to do so there.
- Stop at proof-of-concept. Do not escalate a confirmed vulnerability into full exploitation, lateral movement, or data exfiltration.
- Never fabricate findings to appear thorough. An assessment with fewer, well-evidenced findings is more valuable than one padded with speculation.

## The Ten-Phase Pipeline

| Phase | File | Focus |
|---|---|---|
| 1 | `phases/phase-01-owasp-mapping.md` | Build the applicable OWASP/ASVS/WSTG checklist for this target |
| 2 | `phases/phase-02-recon.md` | Fingerprint stack, map attack surface |
| 3 | `phases/phase-03-blackbox.md` | External, no-source-access testing |
| 4 | `phases/phase-04-greybox.md` | Testing with limited docs/credentials — AuthZ, IDOR, business logic |
| 5 | `phases/phase-05-whitebox.md` | Source code and architecture review |
| 6 | `phases/phase-06-api-security.md` | REST/GraphQL/WebSocket-specific review |
| 7 | `phases/phase-07-business-logic.md` | Workflow abuse, race conditions, payment logic |
| 8 | `phases/phase-08-dependency-review.md` | Library/framework version and advisory review |
| 9 | `phases/phase-09-secure-code-review.md` | Injection, SSRF, crypto, deserialization, secrets |
| 10 | `phases/phase-10-reporting.md` | Consolidate into the final report |
| 11 | `phases/phase-11-cicd.md` | CI/CD pipeline security (supply chain, secrets, deploy gates) |
| 12 | `phases/phase-12-cloud-infra.md` | Cloud & infrastructure security (storage, IAM, network, orchestration) |

Phases are sequential but not strictly gated — the orchestrator (`skills/pentest-orchestrator.md`) may run phases 2, 3, and 5 in parallel where source and black-box access both exist, then merge findings before phase 10. Phases 11 and 12 run whenever pipeline config or infrastructure access is in scope — typically alongside phase 8 (Dependency Review), since all three assess the supply chain and deployment surface rather than the running application itself. They feed into phase 10's report like any other phase.

## Tooling Philosophy

This framework describes *what* to test and *why*, but real assessments are carried out with real tools — this methodology is written to match how professional AppSec/pentest teams actually work day to day, not as an abstract checklist divorced from tooling. **Burp Suite is the default intercepting proxy and manual-testing platform** referenced throughout (Proxy for traffic capture, Repeater for single-request verification, Intruder for throttled/scoped bulk testing in non-production environments, Collaborator for out-of-band confirmation, and relevant extensions such as Autorize/AuthMatrix for authorization testing and JWT Editor for token manipulation). OWASP ZAP is the direct open-source substitute wherever Burp isn't available. See `skills/tooling.md` for the complete phase-by-phase tool mapping, including API tooling (Postman/Insomnia), content-discovery tools (ffuf/gobuster, used narrowly and rate-limited), SAST tools (Semgrep) for code review leads, and dependency-audit CLIs (`npm audit`, `composer audit`, `pip-audit`, `osv-scanner`).

Tool output is always a *lead*, not a finding — every hit from a scanner, extension, or SAST tool still passes through `skills/verification.md` before it can appear in the final report.

## Dynamic Technology Adaptation

The orchestrator does not run every framework-specific skill against every target. Based on `technology-detector.md` output, it activates only the relevant modules — e.g., a Vue + Express target triggers `vue-security.md`, `express-security.md`, `jwt-review.md`, and `api-security.md`, while a Laravel target instead triggers CSRF, Blade templating, and Eloquent-specific checks. This keeps assessments fast, relevant, and free of noise from irrelevant ecosystems.
