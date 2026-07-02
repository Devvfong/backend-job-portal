# Application Security Testing Framework

A modular, framework-agnostic AI-driven methodology for performing **authorized, defensive, non-destructive** application security assessments. It is designed to emulate the workflow of a real AppSec team: reconnaissance, structured OWASP-aligned testing across black-box/grey-box/white-box phases, API and business-logic review, dependency analysis, and professional reporting.

## ⚠️ Scope of Use

This framework exists to help you assess systems **you own or are explicitly authorized to test**. It is not a hacking toolkit, an exploit generator, or a substitute for a licensed penetration test on third-party systems. Every module in this repository is bound by the safety contract described in `methodology.md`.

## Structure

```
security/
  README.md              This file
  methodology.md          Overall philosophy, safety contract, and how phases fit together
  checklist.md             Master OWASP/ASVS/WSTG verification checklist
  references.md            Canonical external references used across modules
  phases/                  The 12-phase assessment pipeline (sequenced)
  skills/                  Self-contained, reusable security modules ("agents")
  tools/                   Supporting CLI tools (recon, engagement tracking, findings triage)
```

## Tools

Three scripts in `tools/` support the human-driven workflow described below — none of them perform active exploitation:

- **`tools/recon.py`** — Passive-only Phase 2 recon: DNS, TLS, security headers, tech fingerprinting, well-known-path checks, optional passive crt.sh subdomain sweep, and OSV.dev advisory lookup for any fingerprinted library version. See `python3 tools/recon.py --help`.
- **`tools/checklist_tracker.py`** — Interactive engagement tracker. Requires an explicit authorization confirmation before it will record anything, then walks phases 1-12, tracks master checklist coverage, logs findings, and generates the final report in `report-generator.md` format. See `python3 tools/checklist_tracker.py new`.
- **`tools/triage.py`** — Ingests raw scanner output (Nuclei JSON, OWASP ZAP JSON/XML, Burp XML export) and converts each hit into a draft finding mapped to OWASP/CWE, explicitly marked `Unconfirmed / Needs Manual Validation` until a human verifies it per `skills/verification.md`. See `python3 tools/triage.py --help`.

All three are local, offline-first CLI tools you run yourself against a target you've already confirmed authorization for. None of them are wired to run autonomously or unattended.

## Tooling

This methodology mirrors how professional AppSec teams actually work: **Burp Suite is the default intercepting proxy / manual-testing platform** (Proxy, Repeater, scoped/throttled Intruder, Collaborator, and extensions like Autorize and JWT Editor), with OWASP ZAP as the open-source fallback. API tooling (Postman/Insomnia), content-discovery tools (ffuf/gobuster), SAST (Semgrep), and dependency-audit CLIs round out the stack. See `skills/tooling.md` for the full phase-by-phase mapping — every phase file also lists its own "Suggested tooling" line.

## How It Works

1. Start with `skills/pentest-orchestrator.md` — it coordinates which phases and skills apply to a given target.
2. `skills/technology-detector.md` and `skills/recon-agent.md` fingerprint the stack and decide which framework-specific skills (Express, Vue, Laravel, NestJS, React, GraphQL, etc.) to activate.
3. The pipeline proceeds through `phases/phase-01` … `phases/phase-12`, each phase pulling in the relevant skills.
4. Every finding flows through the reporting contract defined in `skills/report-generator.md`, producing a single professional report.

## Adding a New Skill

Copy the structure used in any file under `skills/` (Purpose, Scope, Inputs, Outputs, Workflow, Decision Logic, Checklist, False-Positive Reduction, Safe Testing Constraints, Reporting Contract, References) so new modules stay consistent and pluggable into the orchestrator.
