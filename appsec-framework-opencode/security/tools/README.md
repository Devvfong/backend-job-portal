# Tools

Three standalone Python 3 scripts (standard library only — no dependencies to install) that support the human-driven workflow described in `../methodology.md`. **None of these perform active exploitation, and none run unattended.** Each maps to a specific point in the pipeline:

```
recon.py            -> Phase 2  (passive recon/fingerprinting)
checklist_tracker.py -> Phases 1, 10 (engagement setup, coverage tracking, report generation)
triage.py            -> Supports Phases 3/6/8/9 (turns raw scanner output into draft findings)
```

## Typical flow for one engagement

```bash
# 1. Set up the engagement — this will refuse to proceed without an
#    explicit authorization confirmation from you.
python3 checklist_tracker.py new --name acme-webapp

# 2. Passive recon (Phase 2)
python3 recon.py acme.example.com --subdomains --json acme-recon.json

# 3. You drive Phase 3 (black-box) manually with Burp Suite / ZAP,
#    per skills/tooling.md. Export scanner results when done.

# 4. Triage raw scanner output into draft findings
python3 triage.py nuclei-out.jsonl --format nuclei --out acme-triage.md

# 5. Manually verify each draft finding (skills/verification.md), then log
#    confirmed ones into the tracker:
python3 checklist_tracker.py resume acme-webapp.json
#   -> choose "Add finding" for each confirmed issue

# 6. Generate the final report at any point:
python3 checklist_tracker.py report acme-webapp.json
```

## Why these tools stop where they stop

Every tool here does exactly one of: **read-only lookup**, **local state tracking**, or **offline file parsing**. None of them send exploit payloads, brute-force credentials, fuzz inputs, or take any action against a target beyond a handful of polite `GET` requests. That's intentional, not a missing feature — see `../methodology.md`'s Safety Contract for why. The active-testing part of the pipeline (Repeater, Intruder, manual payload crafting) stays with you, in Burp/ZAP, exactly as `skills/tooling.md` describes — a human confirming impact one request at a time.

## `recon.py`

Passive-only Phase 2 recon: DNS, TLS certificate details, security-header analysis, lightweight tech fingerprinting, well-known-path checks (`robots.txt`, `sitemap.xml`, exposed `.git/HEAD`, etc.), optional passive `crt.sh` certificate-transparency subdomain sweep, and OSV.dev advisory lookup for any JS library fingerprinted with a version number.

```
python3 recon.py <domain-or-url> [--json out.json] [--subdomains] [--no-network]
```

## `checklist_tracker.py`

Interactive engagement tracker. `new` requires you to type a confirmation that you own or are authorized to test the target, plus a one-line note on the authorization basis (own system / signed agreement / bug bounty program) — it will not create an engagement file without that. From there it walks the 12-phase pipeline, tracks OWASP/API/ASVS checklist coverage, lets you log findings interactively, and generates the final report in the exact format `skills/report-generator.md` specifies.

```
python3 checklist_tracker.py new [--name engagement-name]
python3 checklist_tracker.py resume <engagement>.json
python3 checklist_tracker.py report <engagement>.json
```

State is a single local JSON file — nothing is sent anywhere.

## `triage.py`

Parses raw output from Nuclei (JSON/JSONL), OWASP ZAP (JSON or XML report), or Burp Suite (XML export) and converts each hit into a draft finding using `skills/report-generator.md`'s standard format, with a best-effort OWASP/CWE mapping. Every draft is explicitly labeled `Unconfirmed / Needs Manual Validation` — per the framework's False-Positive Reduction rule, scanner output is a lead, never a finding, until a human reproduces it.

```
python3 triage.py <scanner-output-file> --format {nuclei,zap,burp,auto} [--out draft.md] [--json draft.json]
```
