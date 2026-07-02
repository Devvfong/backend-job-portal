#!/usr/bin/env python3
"""
triage.py — Findings triage tool

Ingests raw output from common scanners (Nuclei JSON/JSONL, OWASP ZAP JSON or
XML report, Burp Suite XML export) and converts each hit into a DRAFT finding
in the exact format defined by security/skills/report-generator.md — mapped
to an OWASP category and CWE where recognizable.

This tool does not run scanners and does not test anything. It only parses
files you already have on disk. Every draft finding it produces is explicitly
marked "Unconfirmed / Needs Manual Validation" per the framework's
False-Positive Reduction rule: scanner output is a LEAD, not a finding, until
a human reproduces it (see skills/verification.md).

USAGE
  python3 triage.py nuclei-results.jsonl --format nuclei
  python3 triage.py zap-report.json --format zap
  python3 triage.py burp-export.xml --format burp
  python3 triage.py results.json --format auto            # try to detect format
  python3 triage.py results.json --format nuclei --out draft-findings.md
  python3 triage.py results.json --format nuclei --json draft-findings.json
"""

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET

# Rough scanner-name/rule-id -> (OWASP mapping, CWE) lookup.
# Intentionally conservative and non-exhaustive; anything unmatched still
# gets triaged with a blank mapping the human can fill in, rather than a
# guessed one.
OWASP_CWE_MAP = [
    (r"sql[\-_ ]?injection|sqli", "A03 Injection", "CWE-89"),
    (r"xss|cross[\-_ ]site[\-_ ]script", "A03 Injection", "CWE-79"),
    (r"command[\-_ ]?injection|rce|remote[\-_ ]code[\-_ ]exec", "A03 Injection", "CWE-78"),
    (r"ssrf|server[\-_ ]side[\-_ ]request[\-_ ]forg", "A10 Server-Side Request Forgery (SSRF)", "CWE-918"),
    (r"idor|broken[\-_ ]object[\-_ ]level|insecure[\-_ ]direct[\-_ ]object", "A01 Broken Access Control", "CWE-639"),
    (r"broken[\-_ ]access|access[\-_ ]control|authoriz", "A01 Broken Access Control", "CWE-284"),
    (r"path[\-_ ]traversal|directory[\-_ ]traversal|lfi|local[\-_ ]file[\-_ ]inclusion", "A01 Broken Access Control", "CWE-22"),
    (r"csrf|cross[\-_ ]site[\-_ ]request[\-_ ]forg", "A01 Broken Access Control", "CWE-352"),
    (r"xxe|xml[\-_ ]external[\-_ ]entity", "A05 Security Misconfiguration", "CWE-611"),
    (r"deserializ", "A08 Software and Data Integrity Failures", "CWE-502"),
    (r"jwt|json[\-_ ]web[\-_ ]token", "A07 Identification and Authentication Failures", "CWE-347"),
    (r"weak[\-_ ]password|default[\-_ ]credential|weak[\-_ ]auth", "A07 Identification and Authentication Failures", "CWE-521"),
    (r"session[\-_ ]fixation|insecure[\-_ ]session", "A07 Identification and Authentication Failures", "CWE-384"),
    (r"tls|ssl|certificate|weak[\-_ ]cipher", "A02 Cryptographic Failures", "CWE-326"),
    (r"clear[\-_ ]text|plaintext[\-_ ]transmission|hardcoded[\-_ ](secret|password|key)", "A02 Cryptographic Failures", "CWE-798"),
    (r"security[\-_ ]header|missing[\-_ ]header|clickjack|x[\-_ ]frame", "A05 Security Misconfiguration", "CWE-1021"),
    (r"cors|cross[\-_ ]origin", "A05 Security Misconfiguration", "CWE-942"),
    (r"debug[\-_ ]mode|verbose[\-_ ]error|stack[\-_ ]trace|information[\-_ ]disclosure|exposure", "A05 Security Misconfiguration", "CWE-209"),
    (r"outdated|vulnerable[\-_ ]component|known[\-_ ]vulnerab|cve[\-_ ]", "A06 Vulnerable and Outdated Components", "CWE-1104"),
    (r"logging|monitoring|audit[\-_ ]trail", "A09 Security Logging and Monitoring Failures", "CWE-778"),
    (r"open[\-_ ]redirect", "A01 Broken Access Control", "CWE-601"),
    (r"rate[\-_ ]limit|resource[\-_ ]consumption|dos", "API4 Unrestricted Resource Consumption", "CWE-770"),
]

SEVERITY_NORMALIZE = {
    "critical": "Critical", "high": "High", "medium": "Medium", "moderate": "Medium",
    "low": "Low", "info": "Informational", "informational": "Informational",
    "unknown": "Informational",
    # Burp textual + numeric ZAP risk codes
    "3": "High", "2": "Medium", "1": "Low", "0": "Informational",
}


def map_owasp_cwe(text):
    text_l = (text or "").lower()
    for pattern, owasp, cwe in OWASP_CWE_MAP:
        if re.search(pattern, text_l):
            return owasp, cwe
    return "", ""


def normalize_severity(raw):
    if raw is None:
        return "Informational"
    key = str(raw).strip().lower()
    return SEVERITY_NORMALIZE.get(key, raw if raw else "Informational")


def parse_nuclei(path):
    """Nuclei JSONL (one JSON object per line) or a JSON array."""
    findings = []
    with open(path) as f:
        content = f.read().strip()
    records = []
    skipped = 0
    if content.startswith("["):
        records = json.loads(content)
    else:
        for line in content.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                skipped += 1
                continue
    if skipped:
        print(f"[triage] Skipped {skipped} malformed line(s) in {path}", file=sys.stderr)

    for r in records:
        info = r.get("info", {})
        name = info.get("name", r.get("template-id", "Unnamed Nuclei finding"))
        owasp, cwe = map_owasp_cwe(name + " " + r.get("template-id", ""))
        # Nuclei sometimes tags classification.cwe-id directly — prefer that.
        classification = info.get("classification", {}) or {}
        cwe_ids = classification.get("cwe-id")
        if cwe_ids:
            cwe = cwe_ids[0] if isinstance(cwe_ids, list) else cwe_ids
        findings.append({
            "title": name,
            "severity": normalize_severity(info.get("severity")),
            "source": "Nuclei",
            "rule_id": r.get("template-id", ""),
            "component": r.get("matched-at") or r.get("host", ""),
            "evidence": (r.get("extracted-results") or r.get("matcher-name") or ""),
            "owasp_mapping": owasp,
            "cwe": cwe,
            "description": info.get("description", ""),
            "reference": ", ".join(info.get("reference", []) or []),
        })
    return findings


def parse_zap(path):
    """OWASP ZAP JSON report (or XML report)."""
    if path.endswith(".xml"):
        return parse_zap_xml(path)
    with open(path) as f:
        data = json.load(f)
    findings = []
    for site in data.get("site", []):
        for alert in site.get("alerts", []):
            name = alert.get("name") or alert.get("alert", "Unnamed ZAP alert")
            owasp, cwe = map_owasp_cwe(name)
            cwe_id = alert.get("cweid")
            if cwe_id and str(cwe_id) != "-1":
                cwe = f"CWE-{cwe_id}"
            instances = alert.get("instances", [])
            component = instances[0].get("uri", "") if instances else site.get("@name", "")
            findings.append({
                "title": name,
                "severity": normalize_severity(alert.get("riskcode") or alert.get("risk")),
                "source": "OWASP ZAP",
                "rule_id": alert.get("pluginid", ""),
                "component": component,
                "evidence": (instances[0].get("evidence", "") if instances else ""),
                "owasp_mapping": owasp,
                "cwe": cwe,
                "description": alert.get("desc", "").replace("<p>", "").replace("</p>", " "),
                "reference": alert.get("reference", "").replace("<p>", "").replace("</p>", " "),
                "remediation_hint": alert.get("solution", "").replace("<p>", "").replace("</p>", " "),
            })
    return findings


def parse_zap_xml(path):
    tree = ET.parse(path)
    root = tree.getroot()
    findings = []
    for site in root.findall(".//site"):
        site_name = site.get("name", "")
        for alert in site.findall(".//alertitem"):
            name = (alert.findtext("alert") or alert.findtext("name") or "Unnamed ZAP alert")
            owasp, cwe = map_owasp_cwe(name)
            cwe_id = alert.findtext("cweid")
            if cwe_id and cwe_id != "-1":
                cwe = f"CWE-{cwe_id}"
            uri = alert.findtext(".//uri") or site_name
            evidence = alert.findtext(".//evidence") or ""
            findings.append({
                "title": name,
                "severity": normalize_severity(alert.findtext("riskcode") or alert.findtext("riskdesc")),
                "source": "OWASP ZAP",
                "rule_id": alert.findtext("pluginid", ""),
                "component": uri,
                "evidence": evidence,
                "owasp_mapping": owasp,
                "cwe": cwe,
                "description": (alert.findtext("desc") or "").replace("<p>", "").replace("</p>", " "),
                "reference": (alert.findtext("reference") or "").replace("<p>", "").replace("</p>", " "),
                "remediation_hint": (alert.findtext("solution") or "").replace("<p>", "").replace("</p>", " "),
            })
    return findings


def parse_burp(path):
    """Burp Suite XML export (Report > Save as XML)."""
    tree = ET.parse(path)
    root = tree.getroot()
    findings = []
    for issue in root.findall(".//issue"):
        name = issue.findtext("name", "Unnamed Burp finding")
        owasp, cwe = map_owasp_cwe(name)
        severity = issue.findtext("severity", "Informational")
        confidence = issue.findtext("confidence", "")
        host = issue.findtext("host", "")
        path_el = issue.findtext("path", "")
        findings.append({
            "title": name,
            "severity": normalize_severity(severity),
            "source": "Burp Suite",
            "rule_id": issue.findtext("type", ""),
            "component": f"{host}{path_el}",
            "evidence": (issue.findtext("issueDetail") or "").replace("<p>", "").replace("</p>", " ")[:500],
            "owasp_mapping": owasp,
            "cwe": cwe,
            "description": (issue.findtext("issueBackground") or "").replace("<p>", "").replace("</p>", " "),
            "reference": "",
            "burp_confidence": confidence,
        })
    return findings


def detect_format(path):
    if path.endswith(".xml"):
        try:
            tree = ET.parse(path)
            root_tag = tree.getroot().tag
            if root_tag == "issues":
                return "burp"
            if root_tag == "OWASPZAPReport":
                return "zap"
        except ET.ParseError:
            return None
        return None

    try:
        with open(path) as f:
            content = f.read().strip()
    except FileNotFoundError:
        return None

    if not content:
        return None

    # ZAP JSON report: top-level object with a "site" array.
    if content.startswith("{"):
        try:
            data = json.loads(content)
            if isinstance(data, dict) and "site" in data:
                return "zap"
        except json.JSONDecodeError:
            pass

    # Nuclei: either a JSON array of result objects, or JSONL (one object per line),
    # each containing a "template-id" key.
    try:
        if content.startswith("["):
            arr = json.loads(content)
            if arr and isinstance(arr, list) and isinstance(arr[0], dict) and "template-id" in arr[0]:
                return "nuclei"
        else:
            first_line = content.splitlines()[0]
            obj = json.loads(first_line)
            if isinstance(obj, dict) and "template-id" in obj:
                return "nuclei"
    except (json.JSONDecodeError, IndexError):
        pass

    return None


def render_markdown(findings, source_file):
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "Informational": 4}
    findings_sorted = sorted(findings, key=lambda f: severity_order.get(f["severity"], 5))

    out = []
    out.append(f"# Draft Findings — Triaged from `{source_file}`")
    out.append(
        "\n> **All findings below are UNCONFIRMED.** Scanner output is a lead, not a finding, "
        "per `skills/verification.md`. Each item must be manually reproduced with a minimal, "
        "safe proof before it goes into a real report. OWASP/CWE mappings are best-effort "
        "keyword matches — verify them.\n"
    )
    out.append(f"Total raw hits: {len(findings)}\n")

    counts = {}
    for f in findings_sorted:
        counts[f["severity"]] = counts.get(f["severity"], 0) + 1
    out.append("Severity breakdown: " + ", ".join(f"{k}: {v}" for k, v in counts.items()) + "\n")

    for i, f in enumerate(findings_sorted, 1):
        out.append(f"\n### [{f['severity']}] {f['title']} (draft #{i})")
        out.append(f"- Confidence: Unconfirmed / Needs Manual Validation")
        out.append(f"- Source: {f['source']} (rule/plugin ID: {f.get('rule_id', '-') or '-'})")
        out.append(f"- OWASP Mapping: {f['owasp_mapping'] or '(unmapped — assign manually)'}")
        out.append(f"- CWE: {f['cwe'] or '(unmapped — assign manually)'}")
        out.append(f"- Affected Component / Endpoint: {f['component'] or '-'}")
        if f.get("evidence"):
            evidence = str(f["evidence"])[:400]
            out.append(f"- Raw Evidence (redact secrets before reporting!): {evidence}")
        if f.get("description"):
            out.append(f"- Scanner Description: {f['description'][:400]}")
        if f.get("remediation_hint"):
            out.append(f"- Scanner-Suggested Remediation: {f['remediation_hint'][:300]}")
        out.append("- Reproduction Steps (safe): _TODO — verify manually via Burp Repeater / ZAP before reporting_")
        out.append("- Business Impact: _TODO_")
        out.append("- Technical Impact: _TODO_")

    out.append("\n## Next Steps")
    out.append("1. Work through each draft above in severity order.")
    out.append("2. Reproduce with a single, minimal, safe request/input per `skills/verification.md`.")
    out.append("3. Discard false positives; for confirmed findings, fill in the TODO fields.")
    out.append("4. Feed confirmed findings into `checklist_tracker.py` (Add finding) to build the final report.")
    return "\n".join(out)


def main():
    parser = argparse.ArgumentParser(description="Triage raw scanner output into draft findings")
    parser.add_argument("file", help="Path to scanner output file")
    parser.add_argument("--format", choices=["nuclei", "zap", "burp", "auto"], default="auto")
    parser.add_argument("--out", metavar="FILE", help="Write markdown draft findings to FILE (default: stdout)")
    parser.add_argument("--json", metavar="FILE", help="Also write structured JSON draft findings to FILE")
    args = parser.parse_args()

    fmt = args.format
    if fmt == "auto":
        fmt = detect_format(args.file)
        if not fmt:
            print(
                "Could not auto-detect format. Please specify --format nuclei|zap|burp explicitly.",
                file=sys.stderr,
            )
            sys.exit(1)
        print(f"[triage] Auto-detected format: {fmt}", file=sys.stderr)

    parsers = {"nuclei": parse_nuclei, "zap": parse_zap, "burp": parse_burp}
    try:
        findings = parsers[fmt](args.file)
    except FileNotFoundError:
        print(f"[triage] File not found: {args.file}", file=sys.stderr)
        sys.exit(1)
    except (json.JSONDecodeError, ET.ParseError) as e:
        print(
            f"[triage] Could not parse '{args.file}' as {fmt} format: {e}\n"
            f"[triage] Check the file is a valid, complete {fmt} export and not truncated/corrupted. "
            f"If you're not sure of the format, try --format auto.",
            file=sys.stderr,
        )
        sys.exit(1)
    except Exception as e:
        print(f"[triage] Unexpected error parsing '{args.file}' as {fmt}: {e}", file=sys.stderr)
        sys.exit(1)

    if not findings:
        print("[triage] No findings parsed from input file.", file=sys.stderr)

    md = render_markdown(findings, args.file)

    if args.out:
        with open(args.out, "w") as f:
            f.write(md)
        print(f"[triage] Draft findings written to {args.out}", file=sys.stderr)
    else:
        print(md)

    if args.json:
        with open(args.json, "w") as f:
            json.dump(findings, f, indent=2)
        print(f"[triage] Structured JSON written to {args.json}", file=sys.stderr)


if __name__ == "__main__":
    main()
