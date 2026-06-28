# Web Security Agent — Complete Guide

> OWASP Top 10 · 7 phases · with I/O contracts, decision gates, and stop conditions

---

## How to use this guide

Each phase defines:
- **Input** — what the agent needs before starting
- **Output** — what it must produce before the next phase
- **Skills** — which tool/skill to invoke
- **Actions** — step-by-step tasks
- **Decision logic** — what to do when something is (or isn't) found
- **Gate / stop condition** — prerequisite that must be met to proceed

---

## Phase 1 — Reconnaissance

**Input:** Target URL, scope definition, credentials (if auth testing)
**Output:** Endpoint map, tech stack JSON, subdomain list → `recon-report.json`

### Skills
- `@scanning-tools` — security scanning
- `@top-web-vulnerabilities` — OWASP knowledge base

### Actions
1. Map all application endpoints and routes
2. Identify frameworks, servers, and JS libraries
3. Discover subdomains and hidden paths
4. Fingerprint authentication mechanisms
5. Save all findings to `recon-report.json`

### Decision logic
- If **0 endpoints found** → ask user to confirm scope and access before proceeding
- If **>200 endpoints** → narrow scope or run in parallel batches

### Gate
Endpoint map must exist before any other phase begins.

### Prompt
```
Use @scanning-tools to perform web application reconnaissance on {target_url}
```

---

## Phase 2 — Injection Testing

**Input:** Endpoint map from Phase 1, parameter list
**Output:** Injection findings report (vuln / not-vuln per parameter) → `injection-findings.json`

### Skills
- `@sql-injection-testing` — SQL injection
- `@sqlmap-database-pentesting` — automated SQLMap testing

### Actions
1. Test SQL injection on all input fields
2. Test NoSQL injection on JSON endpoints
3. Test command injection on file/OS parameters
4. Test LDAP injection on authentication fields
5. Log each finding with severity level and proof-of-concept payload

### Decision logic
- If **SQLi confirmed** → escalate to `@sqlmap-database-pentesting` for full extraction test
- If **no injection found** → mark clean and continue to Phase 3

### Gate
All parameters in the endpoint map must be tested before Phase 3 starts.

### Prompts
```
Use @sql-injection-testing to test for SQL injection on {endpoint_list}
```
```
Use @sqlmap-database-pentesting to automate SQL injection testing on {vulnerable_endpoint}
```

---

## Phase 3 — XSS Testing

**Input:** Endpoint map, identified reflection points from Phase 2
**Output:** XSS findings — type (reflected / stored / DOM), payload, affected URL → `xss-findings.json`

### Skills
- `@xss-html-injection` — XSS testing
- `@html-injection-testing` — HTML injection

### Actions
1. Test reflected XSS on all user-controlled parameters
2. Test stored XSS on forms that persist data
3. Test DOM-based XSS via URL fragment and hash
4. Attempt filter bypass with encoding variants
5. Capture browser proof-of-concept screenshots

### Decision logic
- If **stored XSS found** → flag as Critical and pause for remediation confirmation before continuing
- If **only reflected XSS** → document and continue

### Gate
Must complete Phase 2 first — shared parameter list reduces redundant requests.

### Prompt
```
Use @xss-html-injection to test for cross-site scripting on {reflection_points}
```

---

## Phase 4 — Authentication Testing

**Input:** Login endpoints, session tokens from recon
**Output:** Auth findings — brute-force protection, session fixation, MFA gaps → `auth-findings.json`

### Skills
- `@broken-authentication` — authentication testing

### Actions
1. Test rate limiting on login endpoint
2. Test credential stuffing with common wordlist
3. Verify session invalidation on logout
4. Check for predictable session token entropy
5. Test MFA bypass via OTP reuse or reset flow

### Decision logic
- If **no rate limiting found** → auto-classify as High severity
- If **MFA bypass found** → stop and report immediately
- If **account lockout threshold is unknown** → ask user before any brute-force testing

### Gate
Stop condition: confirm with user before running brute-force tests if lockout behavior is unknown.

### Prompt
```
Use @broken-authentication to test authentication security on {login_url}
```

---

## Phase 5 — Access Control Testing

**Input:** Authenticated sessions (user + admin), resource IDs from recon
**Output:** IDOR findings, privilege escalation paths, traversal vulnerabilities → `access-control-findings.json`

### Skills
- `@idor-testing` — insecure direct object reference testing
- `@file-path-traversal` — path traversal testing

### Actions
1. Test IDOR by swapping resource IDs between user accounts
2. Test vertical privilege escalation (user → admin endpoints)
3. Test horizontal privilege escalation (user A → user B data)
4. Test directory traversal on file/path parameters
5. Verify unauthorized API endpoint access

### Decision logic
- If **admin endpoints accessible as regular user** → Critical, stop and report immediately
- If **IDOR on PII fields** → High priority escalation before continuing
- If **no IDOR found** → mark clean and continue

### Gate
Requires two test accounts (user + admin) — request from user if not provided before starting.

### Prompts
```
Use @idor-testing to test for insecure direct object references with {session_a} and {session_b}
```
```
Use @file-path-traversal to test for path traversal on {file_param_endpoints}
```

---

## Phase 6 — Security Headers

**Input:** Base URL, all response headers collected during recon
**Output:** Header audit — present / missing / misconfigured per header type → `headers-audit.json`

> This phase can run in parallel with Phase 5 — no dependency.

### Skills
- `@api-security-best-practices` — security headers audit

### Actions
1. Verify `Content-Security-Policy` presence and strictness
2. Check `Strict-Transport-Security` max-age and `includeSubDomains`
3. Test `X-Frame-Options` or CSP `frame-ancestors`
4. Verify `X-Content-Type-Options: nosniff`
5. Check `Referrer-Policy` and `Permissions-Policy`

### Decision logic

| Header missing | Severity |
|---|---|
| HSTS | High |
| CSP | Medium |
| X-Frame-Options (without CSP frame-ancestors) | Medium |
| X-Content-Type-Options | Low |
| Referrer-Policy | Low |

### Prompt
```
Use @api-security-best-practices to audit security headers on {base_url}
```

---

## Phase 7 — Reporting

**Input:** All phase findings, severity classifications, PoC artifacts
**Output:** Final security report (PDF/MD) with CVSS 3.1 scores and remediation steps

### Skills
- `@reporting-standards` — security reporting

### Actions
1. Aggregate findings from all phases
2. Assign CVSS 3.1 score to each vulnerability
3. Write remediation steps per finding
4. Include PoC screenshots and payloads
5. Generate executive summary and technical detail sections

### Decision logic
- If **any Critical found** → include immediate action items at top of report
- If **0 findings** → include a hardening recommendations section instead

### Gate
All phases must be completed (or explicitly skipped with written justification) before report generation.

### Prompt
```
Use @reporting-standards to create security report from {findings_json}
```

---

## OWASP Top 10 Checklist

- [ ] A01: Broken access control
- [ ] A02: Cryptographic failures
- [ ] A03: Injection
- [ ] A04: Insecure design
- [ ] A05: Security misconfiguration
- [ ] A06: Vulnerable and outdated components
- [ ] A07: Authentication failures
- [ ] A08: Software and data integrity failures
- [ ] A09: Security logging and monitoring failures
- [ ] A10: Server-side request forgery (SSRF)

---

## Phase dependency map

```
Phase 1: Reconnaissance
    └── Phase 2: Injection Testing
            └── Phase 3: XSS Testing
Phase 1: Reconnaissance
    └── Phase 4: Authentication Testing
Phase 1: Reconnaissance
    └── Phase 5: Access Control Testing  ──┐
    └── Phase 6: Security Headers        ──┤ (parallel)
                                           │
                                    Phase 7: Reporting
```

---

## Quality gates summary

| Gate | Required before |
|---|---|
| Endpoint map exists | All phases |
| All params tested for injection | Phase 3 |
| Lockout behavior confirmed | Phase 4 brute-force |
| Two test accounts provided | Phase 5 |
| All phases complete or skipped with justification | Phase 7 |

---

## Stop conditions

Stop the agent immediately and escalate to the user if:
- Admin endpoints are accessible as a regular user
- Stored XSS is found on a production environment
- MFA bypass is confirmed
- Out-of-scope systems are discovered during recon
- Evidence of active exploitation is found during testing