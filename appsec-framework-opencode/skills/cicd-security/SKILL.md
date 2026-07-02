---
name: cicd-security
description: Provide the detailed technical checklist for `phases/phase-11-cicd.md` — reviewing pipeline configuration for supply-chain and secrets-handling risk.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# CI/CD Security

## Purpose
Provide the detailed technical checklist for `phases/phase-11-cicd.md` — reviewing pipeline configuration for supply-chain and secrets-handling risk.

## Scope
Any pipeline-as-code definition (GitHub Actions, GitLab CI, Jenkins, CircleCI, Azure Pipelines) reachable via repository access, plus release-process documentation where source access isn't available.

## Inputs
Pipeline config files; branch protection settings (if accessible via API/UI with read permission); a list of third-party Actions/plugins in use.

## Outputs
A list of pipeline security findings: exposed-secret risks, untrusted-trigger risks, supply-chain pinning issues, deploy-gate gaps.

## Workflow
1. Enumerate every workflow/pipeline file in the repo.
2. For each, identify: trigger type (push, PR, PR from fork, schedule, manual), permissions granted, and secrets referenced.
3. Flag any workflow that runs with repo secrets against code from an untrusted fork (`pull_request_target`, or `pull_request` combined with a workflow that later checks out and executes the fork's code with secrets in scope).
4. Check third-party Action/plugin references — are they pinned to a full commit SHA, or a mutable tag/branch?
5. Check for plaintext secrets in env blocks, echoed values in `run:` steps, or debug logging that could leak masked values.
6. Review branch protection: required reviews, required status checks, force-push/deletion protection on protected branches.
7. Trace the path from "PR merged" to "running in production" — identify every automated step and any human approval gate in between.
8. Check artifact/image signing and whether the deploy step verifies signatures before running unverified artifacts.

## Decision Logic
- A workflow triggered by `pull_request_target` that checks out and builds/executes fork PR code while secrets are in scope is a high-severity finding regardless of whether it's been exploited — the condition itself is the vulnerability.
- Unpinned third-party Actions (`@main`, `@v1`) are Medium by default, High if the Action has write access to secrets or can push to the repo.
- Missing branch protection on the default/production branch is High if there's no other compensating control (e.g., a separate deploy-approval gate).
- Absence of any human approval gate between merge and production deploy is a finding worth surfacing even without a specific exploit — it's a design/process risk (maps to A04 Insecure Design), not just a misconfiguration.

## Checklist
- [ ] All pipeline trigger types enumerated and trust boundary assessed (internal vs. fork-originated code)
- [ ] No workflow executes untrusted fork code with secrets in scope
- [ ] Third-party Actions/plugins pinned to commit SHA, not mutable tags
- [ ] No plaintext secrets in workflow env blocks or run steps
- [ ] Secret masking confirmed in build logs
- [ ] Branch protection enforced on production/default branch (required reviews + required status checks)
- [ ] Merge-to-production path traced; human approval gate identified (or its absence flagged)
- [ ] Artifact/container image signing verified at deploy time, or absence flagged
- [ ] Self-hosted runners (if any) confirmed not to accept jobs from public fork PRs

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
- Escalate, don't exploit. Document the vulnerable condition (e.g., specific workflow lines) rather than actually triggering a real deploy, PR merge, or package publish as proof.

## Remediation Pattern: Turning Phase-8 Dependency Review Into a Merge Gate

`phase-08-dependency-review.md` is typically run manually/periodically. Where the project has a CI pipeline, the highest-leverage single remediation is converting that manual check into an automated gate so newly introduced vulnerable dependencies or secrets block the merge rather than being caught later. This is a *fix recommendation* to include in reports, not an active test — implementation happens in the target's own repo, reviewed and merged like any other change.

Example shape (GitHub Actions, Node.js project):

```yaml
name: security-gate
on: [pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<pinned-sha>
      - run: npm ci
      - run: npm audit --audit-level=high
      - name: Secret scan
        uses: <secret-scanning-action>@<pinned-sha>
      - name: SAST (Semgrep)
        run: semgrep ci --config auto
```

Key properties to check for when recommending or reviewing such a gate:
- Runs on every PR, not just scheduled/manual, so regressions are caught before merge, not after.
- Fails the build (not just reports) on high/critical findings — a non-blocking check is a suggestion, not a gate.
- Third-party actions pinned to commit SHA per the checklist above.
- Findings from `npm audit`/Semgrep still route through `verification.md` before being treated as confirmed in a *report* — but blocking the merge itself doesn't require human triage first, since the cost of a false-positive block (re-run, or a documented override) is far lower than the cost of an unreviewed vulnerable dependency reaching production.

## Reporting Contract
Every finding produced by this module must be handed to `report-generator.md` with, at minimum: Title, Severity, Confidence, OWASP mapping and CWE ID, Affected component/endpoint/file, Evidence (redacted of secrets), Safe reproduction steps, Business impact and technical impact, Remediation guidance, Verification steps for re-testing after a fix.

## References
- OWASP Top 10 (A04 Insecure Design, A08 Software and Data Integrity Failures)
- OWASP CI/CD Security Top 10
- CWE-1104 (Use of Unmaintained Third Party Components), CWE-829 (Inclusion of Functionality from Untrusted Control Sphere)
