# Phase 11: CI/CD Pipeline Security

## Purpose
Assess the build, release, and deployment pipeline itself — not just the running application. A perfectly hardened application can still be fully compromised through a weak pipeline (poisoned dependencies, exposed secrets, unreviewed merge-to-deploy paths, or a compromised runner).

## Entry Criteria
Access to pipeline configuration is available in at least one form: repository access to CI config files (`.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `azure-pipelines.yml`, `.circleci/config.yml`), or documentation/interview describing the release process if source access isn't available.

## Activities
- **Pipeline-as-code review.** Read every workflow/pipeline definition file. Look for:
  - Secrets referenced as plaintext env vars instead of a secrets manager/vault integration.
  - `pull_request_target` (GitHub Actions) or equivalent triggers that run with elevated permissions against untrusted fork code — a classic path to secret exfiltration via a malicious PR.
  - Third-party Actions/plugins pinned to a mutable tag (`@main`, `@v1`) instead of a commit SHA — supply-chain risk if the action is compromised or the tag is moved.
  - Self-hosted runners accepting jobs from public/fork PRs (runner compromise → lateral access to internal network).
  - Build steps that `curl | bash` from an unpinned/unauthenticated URL.
- **Secrets hygiene.** Check whether CI secrets are scoped minimally (environment-specific, not "all repos"), rotated, and never echoed to build logs (`::add-mask::` in GitHub Actions or equivalent). Search commit history and build logs for accidentally leaked tokens.
- **Branch protection & approval gates.** Confirm protected branches require review before merge, that CI status checks are required (not just advisory), and that force-push / history-rewrite is disabled on protected branches.
- **Deploy path integrity.** Determine who/what can trigger a production deploy. Is there a human approval gate between "merged" and "live"? Can a single compromised maintainer account push straight to prod?
- **Artifact integrity.** Check whether build artifacts/container images are signed and whether the deploy step verifies that signature (e.g., Sigstore/cosign) rather than trusting whatever is in the registry.
- **Dependency pipeline exposure.** Confirm the CI environment doesn't have broader package-registry publish permissions than necessary (a compromised pipeline that can `npm publish` to your org's packages is a supply-chain risk to every downstream consumer).
- **Infrastructure-as-code scanning.** If Terraform/CloudFormation/Pulumi is part of the pipeline, check for a policy-as-code or IaC scanning step (e.g., `tfsec`, `checkov`) gating apply.

- **Suggested tooling:** manual review of pipeline YAML/config is primary; `gitleaks` or `trufflehog` for secret-in-history scanning; `checkov`/`tfsec` for IaC misconfiguration; GitHub's own Action-pinning advisory / `zizmor` for GitHub Actions-specific supply-chain issues.

## Exit Criteria
A pipeline security summary is produced covering: secrets handling, trust boundary of triggers (fork PRs vs. internal), branch protection posture, deploy-approval gates, and artifact integrity — each finding formatted per `skills/report-generator.md`.

## Related Skills
- `skills/tooling.md`
- `skills/dependency-review.md`
- `skills/threat-intelligence.md`
- `skills/verification.md`

## Safe Testing Constraints

This module operates under the framework-wide safety contract:

- Authorized targets only. Never run against a system without explicit, documented permission from its owner.
- Non-destructive by default. Prefer read-only checks, passive fingerprinting, and single, reversible test requests over anything that mutates state.
- No denial-of-service. Never send high-volume traffic, fuzzers at scale, or resource-exhaustion payloads.
- No production data manipulation. Any proof-of-concept that could create, alter, or delete real records must run against a test account, sandbox tenant, or staging environment.
- One proof per finding. Once a vulnerability is confirmed with a single safe reproduction, stop — do not repeat the exploit or escalate further "to be sure."
- Credential handling. Never log, print, or persist secrets, tokens, or credentials encountered during testing; redact them in evidence and reports.
- Escalate, don't exploit. If a finding could lead to significant impact (e.g., full pipeline compromise, secret exfiltration, unauthorized production deploy), document the safe proof-of-concept and stop rather than pursuing full exploitation. Never actually trigger a real deploy, publish a package, or merge a proof-of-concept PR against a live pipeline as "proof" — describe the exploitable condition and cite the specific config lines instead.
