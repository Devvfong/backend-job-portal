---
name: cloud-infra-security
description: Provide the detailed technical checklist for `phases/phase-12-cloud-infra.md` — assessing the infrastructure layer beneath the application: storage, identity, network, and orchestration.
license: MIT
compatibility: opencode
metadata:
  framework: appsec-testing-framework
  reference_dir: "~/.config/opencode/security"
---

# Cloud & Infrastructure Security

## Purpose
Provide the detailed technical checklist for `phases/phase-12-cloud-infra.md` — assessing the infrastructure layer beneath the application: storage, identity, network, and orchestration.

## Scope
Cloud provider resources (AWS/GCP/Azure/other) and container orchestration (Kubernetes/Docker) supporting the in-scope application. In black-box mode, limited to passively/externally observable infrastructure signals only.

## Inputs
IaC source (Terraform/CloudFormation/Pulumi/K8s manifests) where available; read-only cloud console access where available; externally observable signals (DNS, CDN headers, JS-bundle-referenced storage URLs) in black-box mode.

## Outputs
Infrastructure findings covering storage exposure, IAM posture, network exposure, container/orchestration hardening, and management-plane exposure.

## Workflow
1. Enumerate storage references (bucket/container names) from JS bundles, CDN configs, IaC, or DNS (CNAME to a cloud storage endpoint).
2. Passively check accessibility: a single unauthenticated `HEAD`/`GET` request to determine if a bucket is public — never brute-force bucket names or enumerate contents beyond the initial listing response.
3. In white/grey-box mode, review IAM policies attached to relevant roles/service accounts for wildcard actions/resources and overly broad trust relationships.
4. Review security group / firewall / NSG rules for unintended 0.0.0.0/0 ingress on non-public services.
5. If the app performs server-side URL fetches (SSRF-relevant, see `code-security.md`), check whether the cloud metadata service requires IMDSv2/token-based access.
6. Scan IaC and K8s manifests for hardcoded secrets misplaced in non-secret resources (ConfigMaps, plain env vars).
7. Review K8s RBAC bindings and Pod Security context (root, privileged, hostNetwork) for unnecessary privilege.
8. Identify any admin/management UI (cloud console, K8s dashboard, DB admin tool, monitoring stack) reachable from the public internet and assess its auth posture.
9. Check for publicly shared backups/snapshots/AMIs.

## Decision Logic
- A publicly listable/readable bucket containing anything beyond intentionally public static assets is High/Critical depending on data sensitivity.
- Wildcard IAM permissions (`Action: "*"`, `Resource: "*"`) are High even without a demonstrated path to abuse — the blast radius of any other compromise is what's being measured.
- IMDSv1 enabled (no token requirement) combined with any confirmed or plausible SSRF elsewhere in the app escalates that SSRF finding's severity — cross-reference with Phase 9 findings rather than treating as standalone.
- A reachable management UI with default/weak credentials is Critical; reachable but behind strong auth + MFA is Informational/Low (still worth noting scope reduction opportunity — should it be public at all).

## Checklist
- [ ] Storage buckets/containers referenced by the app enumerated and public-access status checked (passively)
- [ ] IAM policies reviewed for wildcard actions/resources (white/grey-box only)
- [ ] Trust relationships/assume-role policies reviewed for overly broad principals
- [ ] Security group / firewall rules reviewed for unintended public ingress
- [ ] Cloud metadata service version (IMDSv1 vs IMDSv2) checked where SSRF risk exists
- [ ] IaC/K8s manifests scanned for misplaced secrets
- [ ] K8s RBAC and pod security context reviewed for unnecessary privilege
- [ ] Management-plane UIs (console, dashboard, DB admin, monitoring) checked for public reachability and auth strength
- [ ] Backup/snapshot sharing settings reviewed

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
- Escalate, don't exploit. A single listing/read confirming public exposure is sufficient evidence — never bulk-download, modify, or delete real bucket/database contents.

## Reporting Contract
Every finding produced by this module must be handed to `report-generator.md` with, at minimum: Title, Severity, Confidence, OWASP mapping and CWE ID, Affected component/endpoint/file, Evidence (redacted of secrets), Safe reproduction steps, Business impact and technical impact, Remediation guidance, Verification steps for re-testing after a fix.

## References
- OWASP Top 10 (A01 Broken Access Control, A05 Security Misconfiguration)
- CIS Benchmarks (cloud provider and Kubernetes)
- CWE-284 (Improper Access Control), CWE-732 (Incorrect Permission Assignment)
