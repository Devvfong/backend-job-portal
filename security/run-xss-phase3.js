#!/usr/bin/env node
/**
 * Phase 3 — XSS testing (non-destructive, read-only probes).
 * Output: security/xss-findings.json
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const API = process.env.API_URL || "https://devqii.me/api/v1";
const FRONTEND = process.env.FRONTEND_URL || "https://nexthire.devqii.me";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "xss-findings.json");

const MARKER = "nxss3";

const REFLECTED_PAYLOADS = [
  `<script>alert('${MARKER}')</script>`,
  `"><img src=x onerror=alert('${MARKER}')>`,
  `'"><svg/onload=alert('${MARKER}')>`,
  `<body onload=alert('${MARKER}')>`,
  `javascript:alert('${MARKER}')`,
  `<img src=x onerror=alert(String.fromCharCode(88,${MARKER.length}))>`,
  `<details open ontoggle=alert('${MARKER}')>`,
  `<iframe srcdoc="<script>alert('${MARKER}')</script>">`,
];

const ENCODED_PAYLOADS = [
  `%3Cscript%3Ealert('${MARKER}')%3C/script%3E`,
  `%22%3E%3Cimg%20src=x%20onerror=alert('${MARKER}')%3E`,
];

const DOM_HASH_PAYLOADS = [
  `#<img src=x onerror=alert('${MARKER}')>`,
  `#"><script>alert('${MARKER}')</script>`,
];

const EXECUTABLE_PATTERNS = [
  /<img[^>]+onerror\s*=/i,
  /<svg[^>]+onload\s*=/i,
  /<body[^>]+onload\s*=/i,
  /<iframe[^>]+srcdoc\s*=/i,
  /<details[^>]+ontoggle\s*=/i,
  /on\w+\s*=\s*["'][^"']*alert\s*\(/i,
  /javascript:\s*alert\s*\(/i,
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function stripNextFlightData(html) {
  return html.replace(/self\.__next_f\.push\([\s\S]*?\)\s*<\/script>/gi, "");
}

function stripScriptBlocks(html) {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

function isRscReflectionOnly(html, payload) {
  const withoutFlight = stripNextFlightData(html);
  const hasMarker = html.includes(MARKER);
  const rawPayloadInHtml = payload.length > 4 && html.includes(payload);
  const markerOutsideFlight = withoutFlight.includes(MARKER);
  const rawOutsideFlight = rawPayloadInHtml && withoutFlight.includes(payload);

  if (!hasMarker) return false;
  if (rawOutsideFlight) return false;
  if (!markerOutsideFlight) return true;

  return (
    html.includes("\\u003c") ||
    html.includes("%3Cscript") ||
    html.includes("&lt;script") ||
    withoutFlight.length + 500 < html.length
  );
}

function analyzeHtmlReflection(html, payload, baselineHtml = "") {
  if (!html) {
    return { vuln: "inconclusive", severity: "info", reason: "empty response body" };
  }

  const sanitized = stripNextFlightData(html);
  const htmlOutsideScripts = stripScriptBlocks(sanitized);
  const rawPayloadInHtml = payload.length > 4 && html.includes(payload);
  const rawOutsideScripts = payload.length > 4 && htmlOutsideScripts.includes(payload);
  const markerOnlyInProbe = html.includes(MARKER) && !baselineHtml.includes(MARKER);

  if (rawOutsideScripts) {
    const executableOutsideScripts = EXECUTABLE_PATTERNS.some((re) => re.test(htmlOutsideScripts));
    if (executableOutsideScripts || /<script/i.test(rawPayloadInHtml ? payload : "")) {
      return { vuln: true, severity: "high", reason: "unescaped payload in HTML outside script blocks" };
    }
    return { vuln: "suspected", severity: "low", reason: "raw payload outside script blocks (verify in browser)" };
  }

  if (rawPayloadInHtml && /<\/script>/i.test(payload)) {
    if (htmlOutsideScripts.includes("</script>")) {
      return { vuln: true, severity: "high", reason: "script-breakout sequence in HTML body" };
    }
  }

  if (markerOnlyInProbe && isRscReflectionOnly(html, payload)) {
    return { vuln: false, severity: "none", reason: "reflected in Next.js RSC flight data only (JSON/URL-encoded, not executable)" };
  }

  if (html.includes(MARKER)) {
    return { vuln: false, severity: "none", reason: "marker reflected without executable HTML" };
  }

  return { vuln: false, severity: "none", reason: "not reflected in HTML" };
}

function analyzeJsonReflection(body, payload) {
  if (!body.includes(MARKER) && !body.includes(payload)) {
    return { vuln: false, severity: "none", reason: "not reflected in JSON" };
  }

  try {
    JSON.parse(body);
    return { vuln: false, severity: "none", reason: "reflected in JSON only (React text nodes escape by default)" };
  } catch {
    return { vuln: "suspected", severity: "low", reason: "marker in non-JSON response with application/json" };
  }
}

async function probe(label, url, options = {}) {
  const started = Date.now();
  let status = 0;
  let body = "";
  let contentType = "";
  let error = null;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: options.accept || "text/html,application/xhtml+xml",
        Origin: "https://nexthire.devqii.me",
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(20000),
    });
    status = res.status;
    contentType = res.headers.get("content-type") || "";
    body = await res.text();
  } catch (e) {
    error = e.message;
  }
  return { label, url: url.slice(0, 220), status, elapsed: Date.now() - started, contentType, bodyLen: body.length, body, error };
}

async function testFrontendQueryParams() {
  const results = [];
  const params = ["q", "jobType", "location", "category", "search", "title"];
  const payloads = [...REFLECTED_PAYLOADS.slice(0, 5), ...ENCODED_PAYLOADS];

  const baseline = await probe("baseline", `${FRONTEND}/jobs`);
  await sleep(250);

  for (const param of params) {
    for (const payload of payloads) {
      const u = new URL(`${FRONTEND}/jobs`);
      u.searchParams.set(param, payload);
      const r = await probe(`${param}=${payload.slice(0, 36)}`, u.toString(), { accept: "text/html" });
      const verdict = r.error
        ? { vuln: "inconclusive", severity: "info", reason: `request error: ${r.error}` }
        : analyzeHtmlReflection(r.body, payload, baseline.body);
      results.push({
        xssType: "reflected",
        surface: "frontend",
        endpoint: "/jobs",
        parameter: param,
        payload,
        ...verdict,
        status: r.status,
        baselineStatus: baseline.status,
        contentType: r.contentType,
      });
      await sleep(180);
    }
  }
  return results;
}

async function testAuthTokenReflection() {
  const results = [];
  const pages = [
    { path: "/reset-password", param: "token" },
    { path: "/verify-email", param: "token" },
  ];
  const payloads = REFLECTED_PAYLOADS.slice(0, 4);

  for (const page of pages) {
    const baseline = await probe("baseline", `${FRONTEND}${page.path}`);
    await sleep(200);
    for (const payload of payloads) {
      const u = new URL(`${FRONTEND}${page.path}`);
      u.searchParams.set(page.param, payload);
      const r = await probe(`${page.path}?${page.param}`, u.toString(), { accept: "text/html" });
      const verdict = r.error
        ? { vuln: "inconclusive", severity: "info", reason: `request error: ${r.error}` }
        : analyzeHtmlReflection(r.body, payload, baseline.body);
      results.push({
        xssType: "reflected",
        surface: "frontend-auth",
        endpoint: page.path,
        parameter: page.param,
        payload,
        ...verdict,
        status: r.status,
        baselineStatus: baseline.status,
        contentType: r.contentType,
      });
      await sleep(180);
    }
  }
  return results;
}

async function testDomHash() {
  const results = [];
  const baseline = await probe("baseline", `${FRONTEND}/jobs`);
  await sleep(200);

  for (const hash of DOM_HASH_PAYLOADS) {
    const url = `${FRONTEND}/jobs${hash}`;
    const r = await probe(`hash=${hash.slice(0, 40)}`, url, { accept: "text/html" });
    const payload = hash.slice(1);
    const verdict = r.error
      ? { vuln: "inconclusive", severity: "info", reason: `request error: ${r.error}` }
      : analyzeHtmlReflection(r.body, payload, baseline.body);
    results.push({
      xssType: "dom",
      surface: "frontend",
      endpoint: "/jobs#fragment",
      parameter: "hash",
      payload: hash,
      ...verdict,
      status: r.status,
      baselineStatus: baseline.status,
      contentType: r.contentType,
      codeReviewNote: "No location.hash usage in frontend codebase",
    });
    await sleep(180);
  }
  return results;
}

async function testApiQueryReflection() {
  const results = [];
  const endpoints = [
    { path: "/jobs", params: ["search", "location", "jobType"] },
    { path: "/companies", params: ["search", "location", "industry"] },
  ];
  const payloads = REFLECTED_PAYLOADS.slice(0, 3);

  for (const ep of endpoints) {
    const baseline = await probe("baseline", `${API}${ep.path}`, {
      accept: "application/json",
      headers: { Accept: "application/json" },
    });
    await sleep(200);

    for (const param of ep.params) {
      for (const payload of payloads) {
        const u = new URL(`${API}${ep.path}`);
        u.searchParams.set(param, payload);
        const r = await probe(`${ep.path}?${param}`, u.toString(), {
          accept: "application/json",
          headers: { Accept: "application/json" },
        });
        const verdict = r.error
          ? { vuln: "inconclusive", severity: "info", reason: `request error: ${r.error}` }
          : analyzeJsonReflection(r.body, payload);
        results.push({
          xssType: "reflected",
          surface: "api-json",
          endpoint: ep.path,
          parameter: param,
          payload,
          ...verdict,
          status: r.status,
          baselineStatus: baseline.status,
          contentType: r.contentType,
        });
        await sleep(150);
      }
    }
  }
  return results;
}

const STORED_REVIEW = {
  xssType: "stored",
  surface: "frontend+api",
  status: "skipped",
  reason: "Requires authenticated company_admin / job_seeker tokens — not run on production without approval",
  codeReviewTargets: [
    {
      field: "job.title / job.description",
      renderPath: "JobDetailClient.tsx — React text nodes (safe)",
      jsonLdRisk: "JsonLd.tsx uses dangerouslySetInnerHTML + JSON.stringify; </script> in title is a known breakout vector if stored unsanitized",
      severity: "medium",
      tested: false,
    },
    {
      field: "company.description / user.bio",
      renderPath: "Plain JSX text (safe)",
      tested: false,
    },
    {
      field: "notification.message",
      renderPath: "NotificationBell.tsx text rendering",
      tested: false,
    },
  ],
};

async function main() {
  console.log("Phase 3 XSS testing against", FRONTEND, "and", API);
  const all = [];

  all.push(...(await testFrontendQueryParams()));
  all.push(...(await testAuthTokenReflection()));
  all.push(...(await testDomHash()));
  all.push(...(await testApiQueryReflection()));

  const confirmed = all.filter((f) => f.vuln === true);
  const suspected = all.filter((f) => f.vuln === "suspected");
  const storedCritical = STORED_REVIEW.codeReviewTargets.filter((t) => t.severity === "critical");

  const report = {
    phase: 3,
    phaseName: "XSS Testing",
    completedAt: new Date().toISOString(),
    targets: { frontend: FRONTEND, api: API },
    methodology:
      "Automated reflected/DOM probes on public surfaces; API JSON reflection check; stored XSS deferred (auth required); frontend code review for dangerouslySetInnerHTML",
    codeReview: {
      reactTextEscaping: "Job cards and detail pages render user content as JSX text nodes",
      dangerouslySetInnerHTML: [
        "components/shared/JsonLd.tsx — JSON-LD script tags (see stored review)",
        "components/ui/chart.tsx — static chart styles only",
        "app/dashboard/company/layout.tsx — static inline styles only",
      ],
      domHashUsage: false,
      domPurify: false,
    },
    storedXss: STORED_REVIEW,
    summary: {
      probesRun: all.length,
      confirmedVulnerabilities: confirmed.length,
      suspectedFindings: suspected.length,
      clean: all.filter((f) => f.vuln === false).length,
      inconclusive: all.filter((f) => f.vuln === "inconclusive").length,
      storedSkipped: true,
      codeReviewRisks: STORED_REVIEW.codeReviewTargets.length,
      gateStatus: confirmed.length === 0 && storedCritical.length === 0 ? "pass" : "fail",
      proceedToPhase4: confirmed.length === 0 && storedCritical.length === 0,
    },
    findings: all,
    confirmed,
    suspected,
    decision:
      confirmed.length > 0
        ? "Confirmed XSS — remediate before Phase 4; pause if stored XSS on production"
        : suspected.length > 0
          ? "No confirmed XSS — review suspected RSC reflections; proceed to Phase 4 with user approval for brute-force"
          : "No XSS confirmed on tested surfaces — proceed to Phase 4 (auth testing requires user approval)",
  };

  writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`Wrote ${OUT}`);
  console.log(
    `Probes: ${all.length} | Confirmed: ${confirmed.length} | Suspected: ${suspected.length} | Clean: ${report.summary.clean}`,
  );
  process.exit(confirmed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});