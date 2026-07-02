#!/usr/bin/env python3
"""
checklist_tracker.py — Interactive engagement tracker for the AppSec Testing Framework

Walks a human tester through Phases 1-10 (security/phases/*.md), tracks the
master OWASP/API/ASVS/WSTG checklist plus per-finding evidence, and generates
the final report in the format defined by security/skills/report-generator.md.

This tool does NOT test anything itself. It has no HTTP client for active
testing and makes no outbound requests except (optionally) reading the local
phase/skill markdown files for reference. You drive the actual testing with
Burp Suite / ZAP / Postman per security/skills/tooling.md; this tool is where
you record scope, track checklist coverage, and log findings as you go.

USAGE
  python3 checklist_tracker.py new                     # start a new engagement
  python3 checklist_tracker.py new --name acme-webapp
  python3 checklist_tracker.py resume acme-webapp.json  # continue an existing engagement
  python3 checklist_tracker.py report acme-webapp.json  # regenerate the report only
  python3 checklist_tracker.py import-recon acme-webapp.json recon-out.json
                                                         # import recon.py's OWASP-correlated
                                                         # leads as draft (Unconfirmed) findings

Engagement state is stored as a single JSON file you keep alongside your
notes/evidence — nothing is transmitted anywhere.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

FRAMEWORK_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PHASES = [
    ("phase-01", "OWASP Mapping", "phases/phase-01-owasp-mapping.md"),
    ("phase-02", "Recon", "phases/phase-02-recon.md"),
    ("phase-03", "Black-box Testing", "phases/phase-03-blackbox.md"),
    ("phase-04", "Grey-box Testing (AuthZ/IDOR/Business Logic)", "phases/phase-04-greybox.md"),
    ("phase-05", "White-box / Source Review", "phases/phase-05-whitebox.md"),
    ("phase-06", "API Security", "phases/phase-06-api-security.md"),
    ("phase-07", "Business Logic", "phases/phase-07-business-logic.md"),
    ("phase-08", "Dependency Review", "phases/phase-08-dependency-review.md"),
    ("phase-09", "Secure Code Review", "phases/phase-09-secure-code-review.md"),
    ("phase-10", "Reporting", "phases/phase-10-reporting.md"),
    ("phase-11", "CI/CD Pipeline Security", "phases/phase-11-cicd.md"),
    ("phase-12", "Cloud & Infrastructure Security", "phases/phase-12-cloud-infra.md"),
]

MASTER_CHECKLIST = {
    "OWASP Top 10": [
        "A01 Broken Access Control", "A02 Cryptographic Failures", "A03 Injection",
        "A04 Insecure Design", "A05 Security Misconfiguration",
        "A06 Vulnerable and Outdated Components", "A07 Identification and Authentication Failures",
        "A08 Software and Data Integrity Failures", "A09 Security Logging and Monitoring Failures",
        "A10 Server-Side Request Forgery (SSRF)",
    ],
    "OWASP API Security Top 10": [
        "API1 Broken Object Level Authorization", "API2 Broken Authentication",
        "API3 Broken Object Property Level Authorization", "API4 Unrestricted Resource Consumption",
        "API5 Broken Function Level Authorization", "API6 Unrestricted Access to Sensitive Business Flows",
        "API7 Server Side Request Forgery", "API8 Security Misconfiguration",
        "API9 Improper Inventory Management", "API10 Unsafe Consumption of APIs",
    ],
    "ASVS Coverage Areas": [
        "V1 Architecture/Design/Threat Modeling", "V2 Authentication", "V3 Session Management",
        "V4 Access Control", "V5 Validation/Sanitization/Encoding", "V7 Error Handling and Logging",
        "V8 Data Protection", "V9 Communications", "V10 Malicious Code", "V11 Business Logic",
        "V12 Files and Resources", "V13 API and Web Service", "V14 Configuration",
    ],
}

SEVERITIES = ["Critical", "High", "Medium", "Low", "Informational"]
CONFIDENCES = ["High", "Medium", "Low"]


def now():
    return datetime.now(timezone.utc).isoformat()


def prompt(msg, default=None, required=False):
    suffix = f" [{default}]" if default else ""
    while True:
        val = input(f"{msg}{suffix}: ").strip()
        if not val and default is not None:
            return default
        if val or not required:
            return val
        print("  This field is required.")


def prompt_yesno(msg, default=False):
    d = "Y/n" if default else "y/N"
    val = input(f"{msg} [{d}]: ").strip().lower()
    if not val:
        return default
    return val.startswith("y")


def prompt_choice(msg, choices):
    print(f"{msg}")
    for i, c in enumerate(choices, 1):
        print(f"  {i}. {c}")
    while True:
        val = input(f"Choose 1-{len(choices)}: ").strip()
        if val.isdigit() and 1 <= int(val) <= len(choices):
            return choices[int(val) - 1]
        print("  Invalid choice.")


def new_engagement(name):
    print("=" * 70)
    print("NEW ENGAGEMENT — Authorization & Scope Confirmation")
    print("=" * 70)
    print(
        "This framework, and every tool in it, is built for authorized "
        "assessments only. Before anything else is recorded, confirm scope:\n"
    )
    confirmed = prompt_yesno(
        "Do you own this target OR have explicit written authorization "
        "(scope doc, bug bounty program rules, signed engagement letter) to test it?",
        default=False,
    )
    if not confirmed:
        print(
            "\nStopping here. This tracker won't proceed without that confirmation — "
            "get authorization in writing first, then come back."
        )
        sys.exit(1)

    engagement = {
        "name": name,
        "created": now(),
        "updated": now(),
        "authorization_confirmed": True,
        "authorization_note": prompt(
            "Briefly describe the authorization basis (e.g. 'own system', "
            "'signed pentest agreement dated X', 'bug bounty program Y')",
            required=True,
        ),
        "target": prompt("Primary target (domain/URL/repo)", required=True),
        "environment": prompt_choice("Environment under test", ["production", "staging", "test/sandbox", "mixed"]),
        "asvs_level": prompt_choice("ASVS verification level", ["Level 1", "Level 2", "Level 3"]),
        "app_type": prompt(
            "Application type (e.g. 'SPA + REST API', 'server-rendered monolith', 'GraphQL backend')",
            required=True,
        ),
        "out_of_scope": prompt("Anything explicitly OUT of scope? (blank if none)"),
        "checklist": {},
        "phases": {},
        "findings": [],
    }

    for category, items in MASTER_CHECKLIST.items():
        engagement["checklist"][category] = {item: False for item in items}
    for pid, pname, _ in PHASES:
        engagement["phases"][pid] = {"name": pname, "status": "not_started", "notes": ""}

    return engagement


def save(engagement, path):
    with open(path, "w") as f:
        json.dump(engagement, f, indent=2)
    print(f"\nSaved to {path}")


def load(path):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"\nError: engagement file not found: {path}", file=sys.stderr)
        print("Use 'new' to start an engagement, or check the path.", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"\nError: '{path}' is not valid JSON ({e}). It may be corrupted.", file=sys.stderr)
        sys.exit(1)


def add_finding(engagement):
    print("\n-- New Finding --")
    finding = {
        "id": f"F-{len(engagement['findings']) + 1:03d}",
        "title": prompt("Title", required=True),
        "severity": prompt_choice("Severity", SEVERITIES),
        "confidence": prompt_choice("Confidence", CONFIDENCES),
        "owasp_mapping": prompt("OWASP mapping (e.g. A01, API3)"),
        "cwe": prompt("CWE ID (e.g. CWE-639)"),
        "component": prompt("Affected component/endpoint/file", required=True),
        "evidence": prompt("Evidence summary (redact secrets!)"),
        "reproduction": prompt("Safe reproduction steps"),
        "business_impact": prompt("Business impact"),
        "technical_impact": prompt("Technical impact"),
        "remediation": prompt("Remediation guidance"),
        "verification_steps": prompt("Verification steps for re-test after fix"),
        "phase": prompt("Which phase surfaced this? (e.g. phase-04)"),
        "status": "Unconfirmed / Needs Manual Validation" if not prompt_yesno(
            "Have you personally reproduced this with a minimal, safe proof?", default=True
        ) else "Confirmed",
        "logged": now(),
    }
    engagement["findings"].append(finding)
    print(f"Logged {finding['id']}: {finding['title']} ({finding['status']})")


def update_checklist(engagement):
    print("\n-- Update Checklist Coverage --")
    categories = list(engagement["checklist"].keys())
    cat = prompt_choice("Category", categories)
    items = list(engagement["checklist"][cat].keys())
    print("Items (✓ = covered):")
    for i, item in enumerate(items, 1):
        mark = "✓" if engagement["checklist"][cat][item] else " "
        print(f"  [{mark}] {i}. {item}")
    idx = prompt(f"Toggle which item # (1-{len(items)}, blank to skip)")
    if idx.isdigit() and 1 <= int(idx) <= len(items):
        item = items[int(idx) - 1]
        engagement["checklist"][cat][item] = not engagement["checklist"][cat][item]
        print(f"  {item} -> {'covered' if engagement['checklist'][cat][item] else 'not covered'}")


def update_phase(engagement):
    print("\n-- Update Phase Status --")
    pids = list(engagement["phases"].keys())
    for i, pid in enumerate(pids, 1):
        p = engagement["phases"][pid]
        print(f"  {i}. [{p['status']}] {pid}: {p['name']}")
    idx = prompt(f"Which phase # (1-{len(pids)})")
    if idx.isdigit() and 1 <= int(idx) <= len(pids):
        pid = pids[int(idx) - 1]
        status = prompt_choice("New status", ["not_started", "in_progress", "complete", "out_of_scope"])
        engagement["phases"][pid]["status"] = status
        note = prompt("Notes (optional, appended)")
        if note:
            engagement["phases"][pid]["notes"] += (("\n" if engagement["phases"][pid]["notes"] else "") + note)


def coverage_summary(engagement):
    lines = []
    for category, items in engagement["checklist"].items():
        covered = sum(1 for v in items.values() if v)
        lines.append(f"  {category}: {covered}/{len(items)} covered")
    return "\n".join(lines)


def generate_report(engagement):
    e = engagement
    out = []
    out.append(f"# Security Assessment Report — {e['name']}")
    out.append(f"\nGenerated: {now()}")
    out.append(f"\n## Scope & Authorization")
    out.append(f"- Target: {e['target']}")
    out.append(f"- Environment: {e['environment']}")
    out.append(f"- Application type: {e['app_type']}")
    out.append(f"- ASVS level: {e['asvs_level']}")
    out.append(f"- Authorization basis: {e['authorization_note']}")
    if e.get("out_of_scope"):
        out.append(f"- Out of scope: {e['out_of_scope']}")

    findings = e["findings"]
    critical = [f for f in findings if f["severity"] == "Critical"]
    high = [f for f in findings if f["severity"] == "High"]

    out.append("\n## Executive Summary")
    if not findings:
        out.append("No findings have been logged yet. This report reflects checklist coverage only.")
    else:
        out.append(
            f"This assessment logged {len(findings)} finding(s): "
            f"{len(critical)} Critical, {len(high)} High, and "
            f"{len(findings) - len(critical) - len(high)} lower severity. "
            f"{'Immediate remediation is recommended for Critical/High items before other work.' if (critical or high) else 'No Critical or High severity issues were identified in this pass.'}"
        )

    out.append("\n## Technical Summary")
    out.append(f"Phases executed:")
    for pid, p in e["phases"].items():
        out.append(f"- {pid} ({p['name']}): **{p['status']}**" + (f" — {p['notes']}" if p["notes"] else ""))

    out.append("\n## Findings")
    if not findings:
        out.append("_No findings logged._")
    else:
        severity_order = {s: i for i, s in enumerate(SEVERITIES)}
        for f in sorted(findings, key=lambda x: severity_order.get(x["severity"], 99)):
            out.append(f"\n### [{f['severity']}] {f['title']} ({f['id']})")
            out.append(f"- Confidence: {f['confidence']}")
            out.append(f"- Status: {f['status']}")
            out.append(f"- OWASP Mapping: {f['owasp_mapping'] or '-'}")
            out.append(f"- CWE: {f['cwe'] or '-'}")
            out.append(f"- Affected Component: {f['component']}")
            out.append(f"- Evidence: {f['evidence'] or '-'}")
            out.append(f"- Reproduction Steps (safe): {f['reproduction'] or '-'}")
            out.append(f"- Business Impact: {f['business_impact'] or '-'}")
            out.append(f"- Technical Impact: {f['technical_impact'] or '-'}")
            out.append(f"- Remediation: {f['remediation'] or '-'}")
            out.append(f"- Verification Steps: {f['verification_steps'] or '-'}")
            out.append(f"- Source Phase: {f['phase'] or '-'}")

    out.append("\n## Prioritized Remediation Roadmap")
    if findings:
        for i, f in enumerate(sorted(findings, key=lambda x: severity_order.get(x["severity"], 99)), 1):
            out.append(f"{i}. [{f['severity']}] {f['title']} — {f['remediation'] or 'see finding detail'}")
    else:
        out.append("_N/A — no findings logged._")

    out.append("\n## Checklist Coverage")
    out.append(coverage_summary(e).replace("  ", "- "))

    out.append("\n## Developer Checklist (condensed)")
    if findings:
        for f in sorted(findings, key=lambda x: severity_order.get(x["severity"], 99)):
            out.append(f"- [ ] [{f['severity']}] {f['title']} ({f['component']})")
    else:
        out.append("_N/A_")

    return "\n".join(out)


def import_recon(engagement, recon_path):
    """Ingest a recon.py --json report and turn its owasp_correlation hits into
    DRAFT findings. Every imported finding is forced to
    'Unconfirmed / Needs Manual Validation' regardless of what's in the recon
    JSON — recon.py is passive fingerprinting, not proof, and the framework's
    safety contract (phase-01) requires a human-reproduced safe proof before
    anything is called 'Confirmed'. This just saves re-typing recon's leads."""
    try:
        with open(recon_path) as f:
            recon_report = json.load(f)
    except FileNotFoundError:
        print(f"\nError: recon report not found: {recon_path}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"\nError: '{recon_path}' is not valid JSON ({e})", file=sys.stderr)
        sys.exit(1)

    hits = recon_report.get("owasp_correlation", [])
    if not hits:
        print("No owasp_correlation entries found in that recon report — nothing to import.")
        print("(Older recon.py JSON files predate this field — re-run recon.py to regenerate.)")
        return

    existing_evidence = {f.get("evidence") for f in engagement["findings"]}
    imported = 0
    skipped = 0
    for hit in hits:
        if hit["evidence"] in existing_evidence:
            skipped += 1
            continue
        finding = {
            "id": f"F-{len(engagement['findings']) + 1:03d}",
            "title": f"[Recon] {hit['evidence'][:80]}",
            "severity": hit["severity_hint"] if hit["severity_hint"] in SEVERITIES else "Informational",
            "confidence": "Low",  # always Low on import — a human hasn't looked yet
            "owasp_mapping": f"{hit['owasp_id']} {hit['owasp_name']}",
            "cwe": "",
            "component": recon_report.get("hostname", recon_report.get("target", "unknown")),
            "evidence": hit["evidence"],
            "reproduction": "Imported from recon.py — not yet manually reproduced. See recon JSON for the raw check that surfaced this.",
            "business_impact": "",
            "technical_impact": "",
            "remediation": "",
            "verification_steps": "",
            "phase": "phase-02",
            "status": "Unconfirmed / Needs Manual Validation",
            "logged": now(),
        }
        engagement["findings"].append(finding)
        existing_evidence.add(hit["evidence"])
        imported += 1

    print(f"Imported {imported} draft finding(s) from {recon_path} ({skipped} already present, skipped).")
    print("All imported findings are 'Unconfirmed / Needs Manual Validation' — review each one, "
          "add reproduction/impact/remediation detail, and re-mark confidence once verified.")


def interactive_menu(engagement, path):
    while True:
        print("\n" + "=" * 50)
        print(f"Engagement: {engagement['name']}  |  Target: {engagement['target']}")
        print("=" * 50)
        print(coverage_summary(engagement))
        print(f"\nFindings logged: {len(engagement['findings'])}")
        action = prompt_choice("Action", [
            "Update phase status",
            "Update checklist coverage",
            "Add finding",
            "Generate report (preview)",
            "Save & generate report file",
            "Save & exit",
        ])
        if action == "Update phase status":
            update_phase(engagement)
        elif action == "Update checklist coverage":
            update_checklist(engagement)
        elif action == "Add finding":
            add_finding(engagement)
        elif action == "Generate report (preview)":
            print("\n" + generate_report(engagement))
        elif action == "Save & generate report file":
            engagement["updated"] = now()
            save(engagement, path)
            report_path = path.replace(".json", "-report.md")
            with open(report_path, "w") as f:
                f.write(generate_report(engagement))
            print(f"Report written to {report_path}")
        elif action == "Save & exit":
            engagement["updated"] = now()
            save(engagement, path)
            break


def main():
    parser = argparse.ArgumentParser(description="Interactive engagement tracker (Phases 1-10)")
    sub = parser.add_subparsers(dest="command", required=True)

    p_new = sub.add_parser("new", help="Start a new engagement")
    p_new.add_argument("--name", help="Engagement name (used for filename)")

    p_resume = sub.add_parser("resume", help="Resume an existing engagement")
    p_resume.add_argument("file", help="Path to engagement JSON file")

    p_report = sub.add_parser("report", help="Regenerate the report from an engagement file")
    p_report.add_argument("file", help="Path to engagement JSON file")

    p_import = sub.add_parser("import-recon", help="Import draft findings from a recon.py --json report")
    p_import.add_argument("file", help="Path to engagement JSON file")
    p_import.add_argument("recon_json", help="Path to recon.py's --json output file")

    args = parser.parse_args()

    if args.command == "new":
        name = args.name or prompt("Engagement name (used for filename)", required=True)
        engagement = new_engagement(name)
        path = f"{name}.json"
        interactive_menu(engagement, path)
    elif args.command == "resume":
        engagement = load(args.file)
        interactive_menu(engagement, args.file)
    elif args.command == "report":
        engagement = load(args.file)
        report_path = args.file.replace(".json", "-report.md")
        with open(report_path, "w") as f:
            f.write(generate_report(engagement))
        print(f"Report written to {report_path}")
    elif args.command == "import-recon":
        engagement = load(args.file)
        import_recon(engagement, args.recon_json)
        engagement["updated"] = now()
        save(engagement, args.file)


if __name__ == "__main__":
    main()
