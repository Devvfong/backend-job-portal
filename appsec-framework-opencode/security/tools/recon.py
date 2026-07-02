#!/usr/bin/env python3
"""
recon.py — Passive reconnaissance & fingerprinting tool
Part of the Application Security Testing Framework (Phase 2: Recon)

SAFETY CONTRACT (see security/methodology.md):
  - Authorized targets only. Running this against a domain you do not own or
    have explicit written permission to test is on you, not this tool.
  - Passive by design: this script performs read-only HTTP GETs to the target
    and public metadata services (crt.sh, DNS). It never fuzzes, brute-forces,
    floods, or attempts to mutate any state.
  - No credential guessing, no payload injection, no directory brute force
    beyond a very small, well-known static list.

WHAT IT DOES
  1. DNS resolution (A/AAAA/MX/TXT/NS)
  2. TLS certificate inspection (issuer, SANs, expiry, legacy-version flagging)
  3. HTTP response header analysis (security headers, cookies, server fingerprint,
     plus static CSP and HSTS policy analysis for known-weak configurations)
  4. Lightweight tech-stack fingerprinting (headers, meta tags, JS globals, script srcs)
  5. robots.txt / sitemap.xml / .well-known / .git / .env discovery, with a soft-404
     baseline probe and path-specific content checks so hits are confirmed, not just
     "reachable" (a catch-all 200 page no longer reads as a leak)
  6. Certificate-Transparency subdomain enumeration (crt.sh) — passive, no scanning
  7. Dependency-version -> known-advisory lookup: OSV.dev for JS libs with a version
     in their script URL, and NVD for the broader fingerprinted tech_stack (nginx,
     PHP, Laravel, Apache, etc.) — NVD lookups prefer CPE-based matching (accurate
     version-range logic) and fall back to keyword search only when no CPE mapping
     exists, flagging the resulting confidence either way
  8. OWASP Top 10 correlation — cross-references advisories, header findings, TLS
     issues, and confirmed path leaks into Top 10 categories in one summary table

USAGE
  python3 recon.py example.com
  python3 recon.py https://example.com --json out.json
  python3 recon.py example.com --subdomains       # include crt.sh passive subdomain sweep
  python3 recon.py example.com --no-network       # header/TLS only, skip crt.sh/OSV calls

OUTPUT
  Human-readable report to stdout, formatted to drop straight into
  Phase 2 of the assessment / the report-generator.md finding format.
  Optionally also writes structured JSON with --json for the triage tool
  or checklist_tracker.py to consume.
"""

import argparse
import json
import re
import socket
import ssl
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse, urljoin

DEFAULT_TIMEOUT = 8
USER_AGENT = "AppSecFramework-ReconAgent/1.0 (+authorized-assessment; passive)"

SECURITY_HEADERS = [
    "content-security-policy",
    "strict-transport-security",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
    "cross-origin-embedder-policy",
]

# Small, well-known, non-invasive set — this is NOT a brute-force wordlist.
WELL_KNOWN_PATHS = [
    "/robots.txt",
    "/sitemap.xml",
    "/.well-known/security.txt",
    "/.well-known/openapi.json",
    "/openapi.json",
    "/swagger.json",
    "/graphql",
    "/.git/HEAD",  # read-only check for accidental exposure, not exploitation
    "/.env",       # read-only check for accidental exposure, not exploitation
]

TECH_SIGNATURES = [
    # (regex on header/body/script-src, label)
    (r"x-powered-by:\s*express", "Express (Node.js)"),
    (r"x-powered-by:\s*php/([\d.]+)", "PHP"),
    (r"laravel_session", "Laravel"),
    (r"__next_data__|_next/static", "Next.js"),
    (r"data-reactroot|react-dom", "React"),
    (r"ng-version=\"([\d.]+)\"", "Angular"),
    (r"vue(?:\.min)?\.js|__vue__|data-v-", "Vue.js"),
    (r"nestjs|x-powered-by:\s*nest", "NestJS"),
    (r"wp-content|wp-includes", "WordPress"),
    (r"cf-ray:", "Cloudflare (CDN/WAF)"),
    (r"x-amz-cf-id:", "Amazon CloudFront"),
    (r"server:\s*cloudflare", "Cloudflare"),
    (r"server:\s*nginx(?:/([\d.]+))?", "nginx"),
    (r"server:\s*apache(?:/([\d.]+))?", "Apache"),
    (r"x-aspnet-version:\s*([\d.]+)", "ASP.NET"),
    (r"set-cookie:.*django", "Django"),
    (r"x-drupal-", "Drupal"),
    (r"streamlit|stapp|stcanvas|stmarkdowncontainer", "Streamlit"),
    (r"huggingface\.co|hf-space|x-hf-", "Hugging Face Spaces"),
    (r"/assets/index-[\w-]+\.js|vite", "Vite-bundled frontend"),
    (r"gunicorn", "Gunicorn (Python WSGI)"),
    (r"x-powered-by:\s*next\.js", "Next.js"),
    (r"__nuxt__|nuxt-link", "Nuxt.js"),
]


def log(msg):
    print(f"[recon] {msg}", file=sys.stderr)


def http_get(url, timeout=DEFAULT_TIMEOUT, retries=1):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error = None
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body = resp.read(500_000)  # cap read size — no need to pull huge bodies
                return resp.status, dict(resp.headers), body.decode("utf-8", errors="replace"), None
        except urllib.error.HTTPError as e:
            # Got a real HTTP response, just a non-2xx one — this is NOT a connection failure.
            try:
                body = e.read(500_000).decode("utf-8", errors="replace")
            except Exception:
                body = ""
            return e.code, dict(e.headers or {}), body, None
        except (urllib.error.URLError, socket.timeout, TimeoutError, ConnectionError, OSError) as e:
            last_error = str(e)
            time.sleep(0.5)
        except Exception as e:
            last_error = str(e)
            break
    log(f"GET {url} failed after {retries + 1} attempt(s): {last_error}")
    return None, {}, "", last_error


def fetch_with_fallback(hostname, preferred_scheme="https", timeout=DEFAULT_TIMEOUT):
    """Try the preferred scheme, then fall back to the other one before giving up.
    Returns (final_url, status, headers, body, error)."""
    schemes = [preferred_scheme, "http" if preferred_scheme == "https" else "https"]
    last_error = None
    for scheme in schemes:
        url = f"{scheme}://{hostname}"
        status, headers, body, err = http_get(url, timeout=timeout)
        if status is not None:
            return url, status, headers, body, None
        last_error = err
    return f"{preferred_scheme}://{hostname}", None, {}, "", last_error


def normalize_target(target):
    if not target.startswith("http://") and not target.startswith("https://"):
        target = "https://" + target
    return target


def dns_lookup(hostname):
    results = {"a": [], "aaaa": []}
    try:
        infos = socket.getaddrinfo(hostname, None)
        for family, _, _, _, sockaddr in infos:
            addr = sockaddr[0]
            if family == socket.AF_INET and addr not in results["a"]:
                results["a"].append(addr)
            elif family == socket.AF_INET6 and addr not in results["aaaa"]:
                results["aaaa"].append(addr)
    except Exception as e:
        log(f"DNS lookup failed for {hostname}: {e}")
    return results


def tls_inspect(hostname, port=443):
    info = {}
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((hostname, port), timeout=DEFAULT_TIMEOUT) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                info["subject"] = dict(x[0] for x in cert.get("subject", []))
                info["issuer"] = dict(x[0] for x in cert.get("issuer", []))
                info["not_before"] = cert.get("notBefore")
                info["not_after"] = cert.get("notAfter")
                info["san"] = [v for k, v in cert.get("subjectAltName", []) if k == "DNS"]
                info["tls_version"] = ssock.version()
                # expiry check
                try:
                    exp = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z")
                    days_left = (exp.replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)).days
                    info["days_until_expiry"] = days_left
                except Exception:
                    pass
    except Exception as e:
        log(f"TLS inspection failed for {hostname}:{port}: {e}")
        info["error"] = str(e)
    return info


# A partial list of hosts that have historically hosted open-redirects, JSONP
# endpoints, or Angular-callback endpoints usable to bypass a CSP allowlist
# (the same idea Google's CSP Evaluator flags). Not exhaustive, and hosts fix
# these over time — treat a hit here as "worth manually verifying", not proof.
CSP_KNOWN_BYPASS_HOSTS = [
    "www.google.com", "www.googleapis.com", "ajax.googleapis.com",
    "accounts.google.com", "www.gstatic.com", "connect.facebook.net",
    "platform.twitter.com", "www.youtube.com",
]


def analyze_csp(csp_value):
    """Static analysis of a Content-Security-Policy header — parses the policy
    text already retrieved during recon and flags known-weak configurations.
    This is passive: it reasons about the policy string, it does NOT send any
    probe requests or injection payloads. Mirrors the class of checks a tool
    like Google's CSP Evaluator performs."""
    if not csp_value:
        return {"present": False, "findings": []}

    directives = {}
    for part in csp_value.split(";"):
        part = part.strip()
        if not part:
            continue
        tokens = part.split()
        directives[tokens[0].lower()] = tokens[1:]

    findings = []

    def sources_for(name):
        return directives.get(name, directives.get("default-src", []))

    script_src = sources_for("script-src")
    style_src = sources_for("style-src")

    if "'unsafe-inline'" in script_src:
        findings.append({"severity": "High",
            "issue": "script-src allows 'unsafe-inline' — CSP provides little/no XSS mitigation, since inline scripts execute regardless of origin restrictions."})
    if "'unsafe-eval'" in script_src:
        findings.append({"severity": "Medium",
            "issue": "script-src allows 'unsafe-eval' — eval()/Function()/setTimeout(string) can execute attacker-controlled strings as code."})
    if "*" in script_src:
        findings.append({"severity": "High",
            "issue": "script-src allows wildcard '*' — any origin can serve scripts, defeating the allowlist entirely."})
    if "data:" in script_src:
        findings.append({"severity": "Medium",
            "issue": "script-src allows 'data:' URIs — inline data: URLs can be used to smuggle script content, bypassing origin checks."})
    if "'unsafe-inline'" in style_src:
        findings.append({"severity": "Low",
            "issue": "style-src allows 'unsafe-inline' — lower severity than script-src, but can enable CSS-based data exfiltration attacks."})

    if "object-src" not in directives and "default-src" not in directives:
        findings.append({"severity": "Medium",
            "issue": "No object-src or default-src restriction — plugin content (Flash/legacy) is unrestricted where supported."})
    elif directives.get("object-src") not in ([], None) and "'none'" not in directives.get("object-src", []):
        pass  # object-src is explicitly set to something other than 'none' — not flagged further without more context

    if "base-uri" not in directives:
        findings.append({"severity": "Medium",
            "issue": "No base-uri directive — a <base> tag injected via any other flaw can rewrite the base URL for all relative script/link sources."})

    if "frame-ancestors" not in directives:
        findings.append({"severity": "Low",
            "issue": "No frame-ancestors directive — CSP isn't providing clickjacking protection; rely on X-Frame-Options if present."})

    bypass_hits = [h for h in CSP_KNOWN_BYPASS_HOSTS if any(h in s for s in script_src)]
    if bypass_hits:
        findings.append({"severity": "Medium",
            "issue": f"script-src allowlists host(s) with a history of JSONP/open-redirect endpoints usable for CSP bypass: {', '.join(bypass_hits)}. Verify manually whether a bypassable endpoint is still live on that host before relying on this CSP."})

    if not directives.get("report-uri") and not directives.get("report-to"):
        findings.append({"severity": "Informational",
            "issue": "No report-uri/report-to configured — CSP violations won't be reported, making silent policy drift or attempted bypasses invisible."})

    return {"present": True, "directive_count": len(directives), "findings": findings}


def analyze_hsts(hsts_value):
    """Static analysis of Strict-Transport-Security header value."""
    if not hsts_value:
        return {"present": False, "findings": []}
    m = re.search(r"max-age=(\d+)", hsts_value)
    max_age = int(m.group(1)) if m else 0
    findings = []
    if max_age < 15768000:  # ~6 months, common minimum recommendation
        findings.append({"severity": "Low",
            "issue": f"HSTS max-age is {max_age}s (~{max_age // 86400}d) — below the commonly recommended 6-month minimum, weakening downgrade-attack protection."})
    if "includesubdomains" not in hsts_value.lower():
        findings.append({"severity": "Low",
            "issue": "HSTS missing includeSubDomains — subdomains aren't covered, leaving room for cookie/downgrade attacks via a subdomain."})
    return {"present": True, "max_age": max_age, "findings": findings}


def analyze_headers(headers):
    lower_headers = {k.lower(): v for k, v in headers.items()}
    findings = []
    present = {}
    for h in SECURITY_HEADERS:
        if h in lower_headers:
            present[h] = lower_headers[h]
        else:
            findings.append(f"Missing security header: {h}")

    # Cookie flags
    set_cookie = headers.get("Set-Cookie") or lower_headers.get("set-cookie")
    cookie_notes = []
    if set_cookie:
        cookies = set_cookie if isinstance(set_cookie, list) else [set_cookie]
        for c in cookies:
            missing = []
            if "secure" not in c.lower():
                missing.append("Secure")
            if "httponly" not in c.lower():
                missing.append("HttpOnly")
            if "samesite" not in c.lower():
                missing.append("SameSite")
            if missing:
                name = c.split("=")[0]
                cookie_notes.append(f"Cookie '{name}' missing flags: {', '.join(missing)}")

    return {
        "present_security_headers": present,
        "missing_security_headers": findings,
        "cookie_notes": cookie_notes,
        "server": lower_headers.get("server"),
        "x_powered_by": lower_headers.get("x-powered-by"),
        "csp_analysis": analyze_csp(lower_headers.get("content-security-policy")),
        "hsts_analysis": analyze_hsts(lower_headers.get("strict-transport-security")),
    }


def fingerprint_tech(headers, body):
    blob = "\n".join(f"{k}: {v}" for k, v in headers.items()) + "\n" + (body or "")
    blob_lower = blob.lower()
    found = []
    for pattern, label in TECH_SIGNATURES:
        m = re.search(pattern, blob_lower, re.IGNORECASE)
        if m:
            version = None
            if m.groups():
                version = m.group(1)
            found.append({"technology": label, "version": version})

    # script src fingerprinting for common JS libs with version in path/URL
    scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', body or "", re.IGNORECASE)
    libs = []
    for s in scripts:
        m = re.search(r'([a-zA-Z][\w.\-]*?)[.-](\d+\.\d+(?:\.\d+)?)(?:\.min)?\.js', s)
        if m:
            libs.append({"library": m.group(1), "version": m.group(2), "src": s})
    return found, libs


def _soft_404_baseline(base_url, timeout=DEFAULT_TIMEOUT):
    """Fetch a random, near-certainly-nonexistent path first, so we can tell a
    real 200/reachable hit apart from a 'soft 404' — a catch-all page that
    returns HTTP 200 for everything (common with SPA routers, custom error
    pages, or CDN default pages). Without this, every well-known path would
    incorrectly show as 'reachable'."""
    probe_path = f"__reconbaseline_{uuid.uuid4().hex[:12]}__"
    url = urljoin(base_url, probe_path)
    status, headers, body, err = http_get(url, timeout=timeout)
    return {"status": status, "length": len(body or ""), "body_sample": (body or "")[:2000]}


# Path-specific confirmation rules: given a hit's body, decide whether this looks
# like a genuine exposure or a false positive (soft-404, generic landing page, etc).
# Each returns (confirmed: True/False/None, note). None = inconclusive, needs a human look.
def _confirm_git_head(body):
    if re.match(r"^\s*ref:\s*refs/", body) or re.match(r"^\s*[0-9a-f]{40}\s*$", body.strip()):
        return True, "Content matches a real git HEAD file (ref pointer or commit SHA) — .git directory is very likely exposed. High-impact: source, history, and possibly secrets in commit history may be pullable."
    return False, "Responded but content doesn't match git HEAD format — likely a soft-404/catch-all page, not a real exposure."


def _confirm_env_file(body):
    lines = [l for l in body.splitlines() if l.strip() and not l.strip().startswith("#")]
    kv_lines = [l for l in lines if re.match(r"^[A-Z_][A-Z0-9_]*\s*=", l.strip())]
    looks_like_html = "<html" in body.lower()[:500] or "<!doctype" in body.lower()[:500]
    if kv_lines and not looks_like_html and len(kv_lines) >= max(1, len(lines) * 0.5):
        return True, f"Content looks like real KEY=VALUE env output ({len(kv_lines)} matching lines) — likely a genuine .env exposure. Treat as credential leak: do not print values, rotate anything discovered."
    return False, "Responded but content doesn't look like real .env key=value pairs — likely a soft-404/catch-all page."


def _confirm_generic_reachable(body, baseline):
    if baseline and baseline.get("status") is not None:
        if len(body) == baseline["length"] or (body[:500] == baseline.get("body_sample", "")[:500] and body):
            return False, "Response is identical/near-identical to the baseline 404 probe — this looks like a catch-all page, not a real hit."
    return None, "Reachable — review manually to confirm this is a genuine exposure, not a catch-all page."


PATH_CONFIRMERS = {
    "/.git/HEAD": _confirm_git_head,
    "/.env": _confirm_env_file,
}


def check_well_known_paths(base_url):
    log("Establishing soft-404 baseline before checking well-known paths ...")
    baseline = _soft_404_baseline(base_url)

    results = {}
    for path in WELL_KNOWN_PATHS:
        url = urljoin(base_url, path)
        status, headers, body, err = http_get(url)
        if status and status < 400:
            confirmer = PATH_CONFIRMERS.get(path)
            if confirmer:
                confirmed, note = confirmer(body)
            else:
                confirmed, note = _confirm_generic_reachable(body, baseline)
            results[path] = {
                "status": status,
                "length": len(body),
                "confirmed": confirmed,  # True / False / None (inconclusive)
                "note": note,
            }
        time.sleep(0.3)  # be a polite, low-rate passive citizen
    return results


def crtsh_subdomains(domain, timeout=DEFAULT_TIMEOUT):
    """Passive subdomain enumeration via crt.sh certificate transparency logs.
    No scanning of the target itself — purely a public CT-log query."""
    url = f"https://crt.sh/?q=%25.{domain}&output=json"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
        names = set()
        for entry in data:
            for n in entry.get("name_value", "").split("\n"):
                n = n.strip().lstrip("*.")
                if n and domain in n:
                    names.add(n)
        return sorted(names)
    except Exception as e:
        log(f"crt.sh lookup failed (non-fatal, skipping): {e}")
        return []


def osv_lookup(ecosystem, package, version, timeout=DEFAULT_TIMEOUT):
    """Query OSV.dev for known advisories against a fingerprinted package+version.
    Read-only public advisory lookup — this is Phase 8 (Dependency Review) support,
    triggered automatically for anything recon fingerprinted with a version number."""
    url = "https://api.osv.dev/v1/query"
    payload = json.dumps({
        "version": version,
        "package": {"name": package, "ecosystem": ecosystem}
    }).encode()
    try:
        req = urllib.request.Request(url, data=payload, headers={
            "User-Agent": USER_AGENT, "Content-Type": "application/json"
        })
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
        vulns = data.get("vulns", [])
        return [{"id": v.get("id"), "summary": v.get("summary")} for v in vulns]
    except Exception as e:
        log(f"OSV lookup failed for {package}@{version} (non-fatal): {e}")
        return []


# Maps our internal TECH_SIGNATURES labels to good NVD keywordSearch terms.
# NVD's keyword search is a blunt instrument (no real ecosystem/version filtering
# like OSV has), so we keep terms narrow and always re-filter by version client-side.
# Used only as a FALLBACK when CPE_MAP below doesn't have (or can't confirm) a match.
NVD_KEYWORD_MAP = {
    "nginx": "nginx",
    "Apache": "apache http server",
    "PHP": "php",
    "Laravel": "laravel",
    "Express (Node.js)": "express.js node.js",
    "ASP.NET": "asp.net",
    "Django": "django",
    "WordPress": "wordpress",
    "Drupal": "drupal",
    "NestJS": "nestjs",
    "Next.js": "next.js",
    "Nuxt.js": "nuxt.js",
    "Angular": "angular",
    "Gunicorn (Python WSGI)": "gunicorn",
}

# Maps our internal TECH_SIGNATURES labels to (vendor, product) as used in NVD's
# CPE 2.3 naming scheme. When we have this mapping, we can query NVD by cpeName,
# which lets NVD apply its own version-range match logic server-side (handling
# things like "affects >=1.18,<1.18.5" correctly) instead of the free-text
# substring heuristic in _version_in_cve, which misses ranges entirely.
# Verified against nvd.nist.gov/products/cpe/search at time of writing — CPE
# vendor/product strings do occasionally change, so treat mismatches as a sign
# to re-check rather than a bug.
CPE_MAP = {
    "nginx": ("nginx", "nginx"),
    "Apache": ("apache", "http_server"),
    "PHP": ("php", "php"),
    "Laravel": ("laravel", "laravel"),
    "Django": ("djangoproject", "django"),
    "WordPress": ("wordpress", "wordpress"),
    "Drupal": ("drupal", "drupal"),
    "Gunicorn (Python WSGI)": ("gunicorn_project", "gunicorn"),
}


def _version_in_cve(cve_id_summary, version):
    """Best-effort relevance filter used ONLY for the keyword-search fallback path.
    Only surfaces a CVE if the fingerprinted version string appears in its
    description. Not perfect (misses range-based matches like '>=1.18,<1.18.5')
    — that's exactly why the CPE path above is tried first when available."""
    if not version:
        return True  # no version to compare against; let it through, flagged as unversioned
    return version in cve_id_summary


def _nvd_cve_request(params, timeout):
    url = f"https://services.nvd.nist.gov/rest/json/cves/2.0?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))


def nvd_lookup_by_cpe(technology, version, timeout=DEFAULT_TIMEOUT, max_results=10):
    """Preferred NVD lookup path: builds a CPE 2.3 URI for the fingerprinted
    tech+version and queries NVD's cpeName parameter, so NVD applies its own
    version-range matching (correctly handles ranges, not just exact-string
    hits). Returns None (not []) if no CPE mapping exists or the query itself
    fails, so the caller knows to fall back to keyword search rather than
    treating this as a confirmed 'zero CVEs'."""
    mapping = CPE_MAP.get(technology)
    if not mapping or not version:
        return None
    vendor, product = mapping
    cpe23 = f"cpe:2.3:a:{vendor}:{product}:{version}:*:*:*:*:*:*:*"
    try:
        data = _nvd_cve_request({"cpeName": cpe23, "resultsPerPage": max_results}, timeout)
    except Exception as e:
        log(f"NVD CPE lookup failed for {cpe23} (non-fatal, will try keyword fallback): {e}")
        return None

    results = []
    for item in data.get("vulnerabilities", []):
        cve = item.get("cve", {})
        descriptions = cve.get("descriptions", [])
        summary = next((d.get("value") for d in descriptions if d.get("lang") == "en"), "")
        results.append({"id": cve.get("id"), "summary": summary})
    return results  # [] here is a real "no CVEs matched this exact CPE+version", not a failure


def nvd_lookup(technology, version, timeout=DEFAULT_TIMEOUT, max_results=10):
    """Query NVD for a fingerprinted tech_stack entry that OSV.dev doesn't cover
    (OSV is npm/PyPI/etc-ecosystem focused; NVD covers infra/runtime software
    like nginx, PHP, Laravel, ASP.NET). Tries the CPE-based path first (accurate
    version-range matching); falls back to keyword search (approximate,
    substring-only version filtering) if no CPE mapping exists or it errors.
    Read-only public lookup — non-fatal on failure, rate-limited by the caller.

    NVD's public (no-API-key) rate limit is ~5 requests / 30s, so callers must
    space these out (build_report sleeps between calls below)."""
    cpe_results = nvd_lookup_by_cpe(technology, version, timeout=timeout, max_results=max_results)
    if cpe_results is not None:
        for r in cpe_results:
            r["confidence"] = "high (CPE version-range match)"
        return cpe_results

    keyword = NVD_KEYWORD_MAP.get(technology)
    if not keyword:
        return []  # no good keyword mapping for this tech either; skip rather than spam noise

    try:
        data = _nvd_cve_request({"keywordSearch": keyword, "resultsPerPage": max_results}, timeout)
    except Exception as e:
        log(f"NVD keyword lookup failed for {technology}@{version} (non-fatal): {e}")
        return []

    results = []
    for item in data.get("vulnerabilities", []):
        cve = item.get("cve", {})
        cve_id = cve.get("id")
        descriptions = cve.get("descriptions", [])
        summary = next((d.get("value") for d in descriptions if d.get("lang") == "en"), "")
        if _version_in_cve(summary, version):
            results.append({"id": cve_id, "summary": summary, "confidence": "low (keyword match, unverified against version ranges)"})

    if version and not results:
        log(f"NVD keyword search for '{keyword}' returned no version-{version} matches "
            f"in description text — this can be a false negative (version-range CVEs won't "
            f"contain the literal version string), not necessarily 'no CVEs'.")

    return results


def correlate_owasp(report):
    """Cross-reference recon's separate findings (advisories, headers, TLS,
    confirmed path leaks) against OWASP Top 10 categories, so the human
    reviewer gets a consolidated 'what maps to what' view instead of having
    to do that mapping by hand from three different report sections.
    This is correlation of already-gathered passive data, not a new probe."""
    hits = []

    def add(owasp_id, owasp_name, evidence, severity_hint):
        hits.append({"owasp_id": owasp_id, "owasp_name": owasp_name,
                     "evidence": evidence, "severity_hint": severity_hint})

    for adv in report.get("advisories", []):
        ids = ", ".join(a["id"] for a in adv["advisories"] if a.get("id"))
        add("A06", "Vulnerable and Outdated Components",
            f"{adv['library']} v{adv['version']}: {ids} (via {adv.get('source', 'unknown')})",
            "High" if any(a.get("confidence", "").startswith("high") for a in adv["advisories"]) or adv.get("source") == "osv.dev" else "Medium")

    ha = report.get("http", {}).get("headers_analysis", {})
    for missing in ha.get("missing_security_headers", []):
        add("A05", "Security Misconfiguration", missing, "Low")
    for note in ha.get("cookie_notes", []):
        add("A05", "Security Misconfiguration", note, "Medium")
    for f in ha.get("csp_analysis", {}).get("findings", []):
        add("A05", "Security Misconfiguration", f"CSP: {f['issue']}", f["severity"])
    for f in ha.get("hsts_analysis", {}).get("findings", []):
        add("A02", "Cryptographic Failures", f"HSTS: {f['issue']}", f["severity"])
    if ha.get("x_powered_by"):
        add("A05", "Security Misconfiguration",
            f"X-Powered-By header discloses stack: {ha['x_powered_by']}", "Informational")

    tls = report.get("tls", {})
    if tls.get("error"):
        add("A02", "Cryptographic Failures", f"TLS inspection error: {tls['error']}", "Medium")
    elif tls:
        days = tls.get("days_until_expiry")
        if isinstance(days, int) and days < 30:
            add("A02", "Cryptographic Failures",
                f"TLS certificate expires in {days} day(s)", "High" if days < 7 else "Medium")
        version = tls.get("tls_version", "")
        if version and version in ("TLSv1", "TLSv1.1", "SSLv3", "SSLv2"):
            add("A02", "Cryptographic Failures", f"Negotiated legacy TLS version: {version}", "High")

    for path, info in report.get("well_known_paths", {}).items():
        if info.get("confirmed") is True:
            add("A05", "Security Misconfiguration",
                f"Confirmed exposure at {path}: {info['note']}", "Critical" if path in ("/.git/HEAD", "/.env") else "Medium")
        elif info.get("confirmed") is None and path in ("/.git/HEAD", "/.env"):
            add("A05", "Security Misconfiguration",
                f"Unconfirmed reachable hit at {path} — manually verify: {info['note']}", "Medium")

    if report.get("subdomains"):
        add("A05", "Security Misconfiguration",
            f"{len(report['subdomains'])} subdomain(s) discovered via passive CT-log enumeration — review for forgotten/unmaintained hosts", "Informational")

    return hits


def build_report(target, args):
    parsed = urlparse(normalize_target(target))
    hostname = parsed.hostname
    preferred_scheme = parsed.scheme or "https"

    report = {
        "target": target,
        "hostname": hostname,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "reachable": False,
        "connection_error": None,
        "final_url": None,
        "dns": {},
        "tls": {},
        "http": {},
        "tech_stack": [],
        "js_libraries": [],
        "well_known_paths": {},
        "subdomains": [],
        "advisories": [],
        "owasp_correlation": [],
    }

    if not hostname:
        report["connection_error"] = f"Could not parse a hostname from '{target}'."
        return report

    log(f"Resolving DNS for {hostname} ...")
    report["dns"] = dns_lookup(hostname)
    dns_resolved = bool(report["dns"].get("a") or report["dns"].get("aaaa"))

    if not dns_resolved:
        report["connection_error"] = (
            f"DNS resolution failed for '{hostname}'. Check the hostname is correct "
            f"and reachable from this network."
        )
        return report

    if preferred_scheme == "https":
        log("Inspecting TLS certificate ...")
        report["tls"] = tls_inspect(hostname)

    log(f"Fetching {hostname} (trying {preferred_scheme} first, will fall back if needed) ...")
    final_url, status, headers, body, err = fetch_with_fallback(hostname, preferred_scheme)
    report["final_url"] = final_url

    if status is None:
        report["connection_error"] = (
            f"DNS resolved ({', '.join(report['dns'].get('a', []) or report['dns'].get('aaaa', []))}) "
            f"but the HTTP connection itself failed on both https and http: {err}. "
            f"This can mean the service is down, behind a firewall/VPN, rate-limiting/blocking "
            f"this client, or the port is non-standard."
        )
        return report

    report["reachable"] = True
    report["http"]["status"] = status
    report["http"]["headers_analysis"] = analyze_headers(headers)
    report["http"]["raw_headers"] = headers

    tech, libs = fingerprint_tech(headers, body)
    report["tech_stack"] = tech
    report["js_libraries"] = libs

    log("Checking well-known / low-noise paths ...")
    base_url = final_url.rstrip("/")
    report["well_known_paths"] = check_well_known_paths(base_url + "/")

    if not args.no_network:
        if args.subdomains:
            log(f"Querying crt.sh for passive subdomain enumeration on {hostname} ...")
            report["subdomains"] = crtsh_subdomains(hostname)

        if libs:
            log("Cross-checking fingerprinted library versions against OSV.dev ...")
            for lib in libs:
                advisories = osv_lookup("npm", lib["library"], lib["version"])
                if advisories:
                    report["advisories"].append({
                        "library": lib["library"],
                        "version": lib["version"],
                        "advisories": advisories,
                        "source": "osv.dev",
                    })
                time.sleep(0.2)

        versioned_stack = [t for t in tech if t.get("version")
                           and (t["technology"] in CPE_MAP or t["technology"] in NVD_KEYWORD_MAP)]
        if versioned_stack:
            log(f"Cross-checking {len(versioned_stack)} fingerprinted tech_stack "
                f"entr{'y' if len(versioned_stack) == 1 else 'ies'} against NVD ...")
            for t in versioned_stack:
                advisories = nvd_lookup(t["technology"], t["version"])
                if advisories:
                    report["advisories"].append({
                        "library": t["technology"],
                        "version": t["version"],
                        "advisories": advisories,
                        "source": "nvd.nist.gov",
                    })
                # NVD's no-key rate limit is ~5 req/30s (~6s/req) — stay well under it.
                time.sleep(6)

    report["owasp_correlation"] = correlate_owasp(report)
    return report


def render_human(report):
    out = []
    out.append(f"=== Recon Report: {report['hostname']} ===")
    out.append(f"Generated: {report['timestamp']}\n")

    out.append("-- DNS --")
    out.append(f"A:    {', '.join(report['dns'].get('a', [])) or 'none'}")
    out.append(f"AAAA: {', '.join(report['dns'].get('aaaa', [])) or 'none'}\n")

    if not report["reachable"]:
        out.append("=" * 60)
        out.append("⚠ TARGET UNREACHABLE — no further analysis was performed")
        out.append("=" * 60)
        out.append(report.get("connection_error") or "Unknown connection failure.")
        out.append(
            "\nThis is NOT a finding of 'good security' — it means this tool could not "
            "connect, which could be your firewall/VPN, the site being genuinely down, "
            "a typo'd hostname, or the service blocking automated clients. Verify "
            "manually in a browser before drawing any conclusion."
        )
        return "\n".join(out)

    out.append(f"Fetched via: {report['final_url']} (HTTP {report['http'].get('status')})\n")

    if report["tls"]:
        t = report["tls"]
        out.append("-- TLS Certificate --")
        if "error" in t:
            out.append(f"  Error: {t['error']}")
        else:
            out.append(f"  Issuer: {t.get('issuer', {}).get('organizationName', 'unknown')}")
            out.append(f"  Valid until: {t.get('not_after')} ({t.get('days_until_expiry')} days remaining)")
            out.append(f"  TLS version: {t.get('tls_version')}")
            san = t.get("san", [])
            if san:
                out.append(f"  SANs: {', '.join(san[:10])}{' ...' if len(san) > 10 else ''}")
        out.append("")

    ha = report["http"].get("headers_analysis", {})
    out.append("-- HTTP Security Headers --")
    out.append(f"  Server: {ha.get('server', 'not disclosed')}")
    if ha.get("x_powered_by"):
        out.append(f"  X-Powered-By: {ha['x_powered_by']}  (⚠ consider suppressing — reveals stack)")
    for h in ha.get("missing_security_headers", []):
        out.append(f"  ⚠ {h}")
    for note in ha.get("cookie_notes", []):
        out.append(f"  ⚠ {note}")
    if not ha.get("missing_security_headers") and not ha.get("cookie_notes"):
        out.append("  ✓ No missing headers/cookie flags detected in this pass")
    csp = ha.get("csp_analysis", {})
    if csp.get("present") and csp.get("findings"):
        out.append("  CSP analysis:")
        for f in csp["findings"]:
            out.append(f"    [{f['severity']}] {f['issue']}")
    hsts = ha.get("hsts_analysis", {})
    if hsts.get("present") and hsts.get("findings"):
        out.append("  HSTS analysis:")
        for f in hsts["findings"]:
            out.append(f"    [{f['severity']}] {f['issue']}")
    out.append("")

    out.append("-- Fingerprinted Technology --")
    if report["tech_stack"]:
        for t in report["tech_stack"]:
            v = f" v{t['version']}" if t.get("version") else ""
            out.append(f"  - {t['technology']}{v}")
    else:
        out.append("  (none confidently fingerprinted from headers/body)")
    if report["js_libraries"]:
        out.append("  JS libraries with detected versions:")
        for lib in report["js_libraries"]:
            out.append(f"    - {lib['library']} v{lib['version']}  ({lib['src']})")
    out.append("")

    out.append("-- Well-Known / Low-Noise Paths --")
    if report["well_known_paths"]:
        for path, info in report["well_known_paths"].items():
            confirmed = info.get("confirmed")
            if confirmed is True:
                flag = " ⚠ CONFIRMED — genuine exposure, treat as a real finding"
            elif confirmed is False:
                flag = " (likely false positive — see note)"
            else:
                flag = " — needs manual verification" if path in ("/.git/HEAD", "/.env") else ""
            out.append(f"  {path}: HTTP {info['status']}{flag}")
            if info.get("note"):
                out.append(f"      {info['note']}")
    else:
        out.append("  none reachable")
    out.append("")

    if report.get("subdomains"):
        out.append(f"-- Passive Subdomains (crt.sh, {len(report['subdomains'])} found) --")
        for s in report["subdomains"][:50]:
            out.append(f"  - {s}")
        if len(report["subdomains"]) > 50:
            out.append(f"  ... and {len(report['subdomains']) - 50} more (see JSON output)")
        out.append("")

    if report.get("advisories"):
        out.append("-- Known Advisories for Fingerprinted Versions --")
        for a in report["advisories"]:
            source = a.get("source", "unknown source")
            out.append(f"  {a['library']} v{a['version']} (via {source}):")
            for adv in a["advisories"]:
                out.append(f"    - {adv['id']}: {adv['summary']}")
        out.append("")

    if report.get("owasp_correlation"):
        severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "Informational": 4}
        out.append("-- OWASP Top 10 Correlation --")
        by_category = {}
        for hit in sorted(report["owasp_correlation"], key=lambda h: severity_order.get(h["severity_hint"], 99)):
            by_category.setdefault((hit["owasp_id"], hit["owasp_name"]), []).append(hit)
        for (oid, oname), hits in by_category.items():
            out.append(f"  {oid} — {oname}:")
            for hit in hits:
                out.append(f"    [{hit['severity_hint']}] {hit['evidence']}")
        out.append("")

    out.append("-- Next Steps --")
    out.append("  1. Feed this JSON output into checklist_tracker.py to seed Phase 2 findings")
    out.append("     (use: python3 checklist_tracker.py import-recon <engagement.json> <this-report.json>).")
    out.append("  2. Manually verify every flagged item — this is a passive lead list, not a report.")
    out.append("  3. Proceed to Phase 3 (black-box) using Burp/ZAP for anything requiring interaction.")
    return "\n".join(out)


def main():
    parser = argparse.ArgumentParser(description="Passive recon & fingerprinting tool (Phase 2)")
    parser.add_argument("target", help="Domain or URL to recon (e.g. example.com)")
    parser.add_argument("--json", metavar="FILE", help="Write structured JSON output to FILE")
    parser.add_argument("--subdomains", action="store_true",
                         help="Include passive crt.sh certificate-transparency subdomain sweep")
    parser.add_argument("--no-network", action="store_true",
                         help="Skip external lookups (crt.sh, OSV.dev) — headers/TLS only")
    args = parser.parse_args()

    print(
        "NOTE: This tool performs passive, read-only checks against the target you specify.\n"
        "Run it only against systems you own or are explicitly authorized to test.\n",
        file=sys.stderr,
    )

    try:
        report = build_report(args.target, args)
    except Exception as e:
        print(f"\n[recon] Unexpected error while assessing '{args.target}': {e}", file=sys.stderr)
        print("[recon] This is a bug in the tool, not a finding about the target. Please report it.", file=sys.stderr)
        sys.exit(2)

    print(render_human(report))

    if args.json:
        with open(args.json, "w") as f:
            json.dump(report, f, indent=2)
        log(f"Structured JSON written to {args.json}")


if __name__ == "__main__":
    main()
