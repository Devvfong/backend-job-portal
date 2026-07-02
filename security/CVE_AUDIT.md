# CVE Audit — NextHire

**Date:** July 2, 2026  
**Backend:** Express 5.2.1 (installed)  
**Frontend:** Next.js 16.2.6 (installed)  
**Multer:** 2.2.0 (installed, transitive via Express ecosystem)

---

## Backend — Express 5.2.1

### CVE-2024-51999 (GHSA-pj86-cfqh-vqx6) — Prototype Pollution via Extended Query Parser

| Field | Value |
|---|---|
| **Affects 5.2.1?** | No |
| **Status** | **CVE REJECTED / Advisory Withdrawn** |
| **Details** | The CVE was published alongside the 5.2.0 fix but withdrawn on 2025-12-02 as a "correctness bug, not a vulnerability with real security impact." Express 5.2.1 explicitly reverted the breaking change with a changelog entry stating the CVE was rejected. Furthermore, Express 5 defaults to the `simple` query parser — the `extended` parser must be opted into. |
| **Action** | None. No real vulnerability exists. |

### CVE-2024-47764 — Cookie Dependency

| Field | Value |
|---|---|
| **Affects 5.2.1?** | No |
| **Status** | **Patched since Express 5.0.1** |
| **Details** | Vulnerability in `cookie` < 0.7.0 (improper Samesite attribute handling). Express 5.0.1 updated the semver lock to `cookie@^0.7.0`. Express 5.2.1 inherits this. |
| **Action** | None. Already on a fixed dependency chain. |

### CVE-2024-29041 (GHSA-rv95-896h-c2vc) — Open Redirect in Malformed URLs

| Field | Value |
|---|---|
| **Affects 5.2.1?** | No |
| **Status** | **Patched since Express 5.0.0-beta.3** |
| **Details** | Open redirect via `res.location()` / `res.redirect()` with malformed URLs. Only affects < 4.19.2 and pre-release alpha/beta versions < 5.0.0-beta.3. Express 5.2.1 is a stable release well past the fix. |
| **Action** | None. |

### 2026 Express Ecosystem Advisories — Multer

Three DoS vulnerabilities were found in multer (Feb–Mar 2026):

| CVE | GHSA | Severity | Fixed in |
|---|---|---|---|
| CVE-2026-2359 | GHSA-v52c-386h-88mc | High (7.5) | multer 2.1.0 |
| CVE-2026-3304 | GHSA-xf7r-hgr6-v32p | High | multer 2.1.0 |
| CVE-2026-3520 | GHSA-5528-5vmv-3xc2 | High | multer 2.1.1 |

- **Installed multer version:** 2.2.0  
- **Affected?** No. All three CVEs are fixed in versions ≤ 2.1.1; the installed 2.2.0 is patched.

### 2026 Express Ecosystem Advisories — Multiparty

Three DoS vulnerabilities (CVE-2026-8159, CVE-2026-8161, CVE-2026-8162) in `multiparty` ≤ 4.2.3, fixed in 4.3.0.

- **Installed:** `multiparty` is **not a dependency** (direct or transitive) of this project.  
- **Affected?** No.

### Summary: Backend

| Advisory | Affected? | Action |
|---|---|---|
| CVE-2024-51999 | No (CVE rejected) | None |
| CVE-2024-47764 | No (fixed in 5.0.1) | None |
| CVE-2024-29041 | No (fixed in 5.0.0-beta.3) | None |
| CVE-2026-2359 / -3304 (multer) | No (installed 2.2.0 ≥ 2.1.0) | None |
| CVE-2026-3520 (multer) | No (installed 2.2.0 ≥ 2.1.1) | None |
| CVE-2026-8159 / -8161 / -8162 (multiparty) | No (not installed) | None |

---

## Frontend — Next.js 16.2.6

### CVE-2026-23870 (GHSA-8h8q-6873-q5fj) — DoS via Server Components

| Field | Value |
|---|---|
| **Affects 16.2.6?** | No |
| **Patched version** | 16.2.5 (OSV), 16.2.6 recommended per Vercel changelog |
| **Details** | Crafted HTTP request to App Router Server Function endpoints triggers excessive CPU usage during deserialization. Affects >=16.0.0 <16.2.5. |
| **Action** | None. Version 16.2.6 includes the fix. |

### CVE-2026-29057 (GHSA-ggv3-7p47-pfv8) — HTTP Request Smuggling in Rewrites

| Field | Value |
|---|---|
| **Affects 16.2.6?** | No |
| **Patched version** | 16.1.7 |
| **Details** | Crafted `DELETE`/`OPTIONS` with `Transfer-Encoding: chunked` causes request boundary disagreement in rewrite proxy, enabling smuggling to unintended backend routes. Affects >=16.0.0 <16.1.7. |
| **Action** | None. Version 16.2.6 includes the fix. |

### CVE-2026-44581 (GHSA-ffhc-5mcf-pf4q) — Stored XSS via CSP Nonces

| Field | Value |
|---|---|
| **Affects 16.2.6?** | No |
| **Patched version** | 16.2.5 |
| **Details** | Malformed nonce values derived from request headers reflected into rendered HTML, enabling cache-poisoned stored XSS behind shared caches. Affects >=16.0.0 <16.2.5. |
| **Action** | None. Version 16.2.6 includes the fix. |

### CVE-2026-44579 (GHSA-mg66-mrh9-m8jx) — DoS via PPR (Partial Prerendering)

| Field | Value |
|---|---|
| **Affects 16.2.6?** | No |
| **Patched version** | 16.2.5 |
| **Details** | Crafted POST to server action triggers request-body handling deadlock, exhausting file descriptors. Affects >=16.0.0 <16.2.5. |
| **Action** | None. Version 16.2.6 includes the fix. |

### Summary: Frontend

| Advisory | Affected? | Action |
|---|---|---|
| CVE-2026-23870 (DoS RSC) | No (16.2.6 ≥ 16.2.5) | None |
| CVE-2026-29057 (smuggling) | No (16.2.6 ≥ 16.1.7) | None |
| CVE-2026-44581 (Stored XSS) | No (16.2.6 ≥ 16.2.5) | None |
| CVE-2026-44579 (DoS PPR) | No (16.2.6 ≥ 16.2.5) | None |

---

## Overall Verdict

**Zero actionable CVEs.** All eight advisories are either:
1. Rejected/withdrawn (CVE-2024-51999),
2. Fixed in versions already surpassed (all remaining seven),
3. Or affect dependencies absent from the project (multiparty).

No version bumps, overrides, or patches are required at this time.
