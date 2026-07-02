# Master Verification Checklist

This is the top-level checklist the orchestrator expands per-target in Phase 1. Individual skills carry their own detailed checklists; this file tracks assessment-level coverage.

## OWASP Top 10 (Web)
- [ ] A01 Broken Access Control
- [ ] A02 Cryptographic Failures
- [ ] A03 Injection
- [ ] A04 Insecure Design
- [ ] A05 Security Misconfiguration
- [ ] A06 Vulnerable and Outdated Components
- [ ] A07 Identification and Authentication Failures
- [ ] A08 Software and Data Integrity Failures
- [ ] A09 Security Logging and Monitoring Failures (see `skills/audit-log-integrity.md` for financial/compliance-scoped audit trails)
- [ ] A10 Server-Side Request Forgery (SSRF)

## OWASP API Security Top 10
- [ ] API1 Broken Object Level Authorization (BOLA/IDOR)
- [ ] API2 Broken Authentication
- [ ] API3 Broken Object Property Level Authorization
- [ ] API4 Unrestricted Resource Consumption
- [ ] API5 Broken Function Level Authorization
- [ ] API6 Unrestricted Access to Sensitive Business Flows
- [ ] API7 Server Side Request Forgery
- [ ] API8 Security Misconfiguration
- [ ] API9 Improper Inventory Management
- [ ] API10 Unsafe Consumption of APIs

## ASVS Coverage Areas
- [ ] V1 Architecture, Design, Threat Modeling
- [ ] V2 Authentication
- [ ] V3 Session Management
- [ ] V4 Access Control
- [ ] V5 Validation, Sanitization, Encoding
- [ ] V7 Error Handling and Logging
- [ ] V8 Data Protection
- [ ] V9 Communications
- [ ] V10 Malicious Code
- [ ] V11 Business Logic
- [ ] V12 Files and Resources
- [ ] V13 API and Web Service
- [ ] V14 Configuration

## WSTG Categories
- [ ] Information Gathering
- [ ] Configuration and Deployment Management
- [ ] Identity Management
- [ ] Authentication
- [ ] Authorization
- [ ] Session Management
- [ ] Input Validation
- [ ] Error Handling
- [ ] Cryptography
- [ ] Business Logic
- [ ] Client-Side Testing
- [ ] API Testing

## CI/CD Pipeline Security (Phase 11)
- [ ] Pipeline trigger trust boundaries reviewed (fork PR vs internal)
- [ ] Third-party Actions/plugins pinned to commit SHA
- [ ] No plaintext secrets in pipeline config; masking confirmed
- [ ] Branch protection enforced on production/default branch
- [ ] Merge-to-production path and approval gates traced
- [ ] Artifact/image signing verified at deploy time

## Cloud & Infrastructure Security (Phase 12)
- [ ] Storage bucket/container public-access status checked
- [ ] IAM policies reviewed for wildcard actions/resources
- [ ] Security group / firewall rules reviewed for unintended public ingress
- [ ] Cloud metadata service version checked (IMDSv1 vs IMDSv2) where SSRF risk exists
- [ ] K8s RBAC and pod security context reviewed
- [ ] Management-plane UIs checked for public reachability and auth strength

## Assessment Housekeeping
- [ ] Authorization / scope agreement confirmed before testing began
- [ ] Technology stack fully fingerprinted
- [ ] All in-scope framework-specific skills identified and run
- [ ] Every finding independently reproduced
- [ ] Every finding mapped to OWASP + CWE
- [ ] Report reviewed for false positives before delivery
