# Phase 12: Cloud & Infrastructure Security

## Purpose
Extend the assessment beyond application code to the cloud/infrastructure layer it runs on — misconfigured storage, over-permissioned identities, and exposed management surfaces are consistently among the highest-impact, easiest-to-find issues in real-world breaches.

## Entry Criteria
Some level of infrastructure visibility exists: IaC source (Terraform/CloudFormation/Pulumi/Kubernetes manifests), cloud console/read-only access, or — in pure black-box mode — only what's externally discoverable (DNS, exposed endpoints, storage bucket naming conventions).

## Activities
- **Object storage exposure.** Check whether S3/GCS/Azure Blob buckets referenced by the app (from JS bundle URLs, CDN configs, or IaC) are publicly listable/writable when they shouldn't be. Passive checks only (a `GET`/`HEAD` on a known bucket URL) — never attempt to write, delete, or enumerate via brute force.
- **Identity & access (IAM) review.** In white-box/grey-box mode with IaC or console access: look for wildcard permissions (`*:*`), overly broad trust policies (any-account assume-role), long-lived static credentials where short-lived/OIDC federation should be used, and service accounts with more privilege than their function needs.
- **Network exposure.** Review security groups / firewall rules / network ACLs for 0.0.0.0/0 ingress on anything beyond the intended public surface (esp. databases, admin panels, metadata service ports, internal APIs).
- **Cloud metadata service (SSRF pivot) exposure.** If the app has any server-side URL-fetching behavior (already covered in `skills/code-security.md` SSRF checks), confirm whether IMDSv1 is still enabled (vs. IMDSv2 with hop-limit/token enforcement) — this determines whether an SSRF finding escalates to full credential theft.
- **Secrets in infrastructure config.** Search Terraform state files, Kubernetes manifests/ConfigMaps (not Secrets — check whether sensitive values were incorrectly placed in a ConfigMap), and environment-variable definitions for hardcoded credentials.
- **Container & orchestration posture.** For Kubernetes: check for containers running as root without need, missing `NetworkPolicy` segmentation, overly permissive RBAC bindings (`cluster-admin` bound broadly), and exposed dashboards/kubelet APIs. For plain Docker: check for exposed Docker socket mounts and images built from untrusted/unpinned base images.
- **Management-plane exposure.** Confirm cloud consoles, Kubernetes dashboards, database admin UIs (phpMyAdmin, pgAdmin, Redis Commander, etc.), and internal monitoring tools (Grafana, Kibana) are not reachable from the public internet, or if they are, are behind strong auth + MFA.
- **Backup & snapshot exposure.** Check whether database snapshots, backups, or AMIs are shared publicly or across unintended accounts.

- **Suggested tooling:** `checkov`, `tfsec`, or `terrascan` for IaC misconfiguration scanning (leads only, verify manually); cloud-provider native tools (AWS Trusted Advisor / Security Hub, GCP Security Command Center) where the assessor has read access; passive bucket-permission checks via a single unauthenticated `HEAD` request, never automated bucket-name brute forcing.

## Exit Criteria
An infrastructure findings summary is produced covering storage exposure, IAM posture, network exposure, container/orchestration hardening, and management-plane exposure — each finding formatted per `skills/report-generator.md`.

## Related Skills
- `skills/tooling.md`
- `skills/code-security.md` (SSRF cross-reference)
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
- Escalate, don't exploit. If a finding could lead to significant impact (e.g., full cloud account takeover, mass data exposure from a public bucket, cluster-admin compromise), document the safe proof-of-concept and stop. Never write to, delete from, or exfiltrate real contents of a discovered-open bucket/database as "proof" — a single read of non-sensitive metadata (e.g., bucket listing showing it's public) is sufficient evidence.
