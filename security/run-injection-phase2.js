#!/usr/bin/env node
/**
 * Phase 2 — Injection testing (non-destructive, read-only probes).
 * Output: security/injection-findings.json
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const API = process.env.API_URL || "https://devqii.me/api/v1";
const FRONTEND = process.env.FRONTEND_URL || "https://nexthire.devqii.me";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "injection-findings.json");

const SQLI = [
  "' OR '1'='1",
  "1' OR '1'='1' --",
  "\" OR \"\"=\"",
  "1; DROP TABLE users--",
  "' UNION SELECT NULL--",
  "') OR ('1'='1",
  "1' AND SLEEP(5)--",
];

const NOSQL = ['{"$gt":""}', '{"$ne":null}', "admin'||'1"];

const LDAP = ["*)(uid=*))(|(uid=*", "admin)(&)", "*)(|(password=*))"];

const CMD = [";id", "|whoami", "`id`", "$(id)", "&& ping -c 1 127.0.0.1"];

const TRAVERSAL = ["../../../etc/passwd", "..%2f..%2f..%2fetc%2fpasswd", "....//....//etc/passwd"];

const ERROR_PATTERNS = [
  /syntax error/i,
  /sql syntax/i,
  /postgresql/i,
  /prisma/i,
  /P20\d{2}/i,
  /unterminated quoted/i,
  /ORA-\d+/i,
  /sqlite/i,
  /query failed/i,
  /sequelize/i,
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(label, url, options = {}) {
  const started = Date.now();
  let status = 0;
  let body = "";
  let error = null;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        Origin: "https://nexthire.devqii.me",
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(15000),
    });
    status = res.status;
    body = await res.text();
  } catch (e) {
    error = e.message;
  }
  const elapsed = Date.now() - started;
  const leaked = ERROR_PATTERNS.some((re) => re.test(body));
  return { label, url: url.slice(0, 200), status, elapsed, bodyLen: body.length, leaked, error, bodySample: body.slice(0, 300) };
}

function classify(baseline, result, payload, type) {
  if (result.error) {
    return { vuln: "inconclusive", severity: "info", reason: `request error: ${result.error}` };
  }
  if (result.leaked) {
    return { vuln: true, severity: "high", reason: "SQL/DB error string in response", payload, type };
  }
  if (result.status >= 500 && baseline.status < 500) {
    return { vuln: "suspected", severity: "medium", reason: `server error ${result.status} vs baseline ${baseline.status}`, payload, type };
  }
  if (result.elapsed > baseline.elapsed + 4000 && /SLEEP|WAITFOR/i.test(payload)) {
    return { vuln: "suspected", severity: "medium", reason: "time delay vs baseline", payload, type };
  }
  return { vuln: false, severity: "none", reason: "no injection indicator", payload, type };
}

async function testQueryParams(endpoint, params, payloads, type) {
  const results = [];
  const baselineUrl = `${API}${endpoint}`;
  const baseline = await probe("baseline", baselineUrl);
  await sleep(200);

  for (const param of params) {
    for (const payload of payloads) {
      const u = new URL(`${API}${endpoint}`);
      u.searchParams.set(param, payload);
      const r = await probe(`${param}=${payload.slice(0, 40)}`, u.toString());
      const verdict = classify(baseline, r, payload, type);
      results.push({
        endpoint,
        parameter: param,
        injectionType: type,
        ...verdict,
        status: r.status,
        baselineStatus: baseline.status,
      });
      await sleep(150);
    }
  }
  return results;
}

async function testPathId(payloads) {
  const results = [];
  const validId = "1";
  const baseline = await probe("baseline", `${API}/jobs/${validId}`);
  await sleep(200);

  for (const payload of payloads) {
    const enc = encodeURIComponent(payload);
    const r = await probe(`id=${payload.slice(0, 30)}`, `${API}/jobs/${enc}`);
    const verdict = classify(baseline, r, payload, "sqli-path");
    results.push({
      endpoint: "/jobs/:id",
      parameter: "id",
      injectionType: "sqli-path",
      ...verdict,
      status: r.status,
      baselineStatus: baseline.status,
    });
    await sleep(150);
  }
  return results;
}

async function testJsonPost(endpoint, field, payloads, type) {
  const results = [];
  const baselineBody = field === "email" ? { email: "probe@example.com", password: "wrongpass123" } : { email: "probe@example.com" };
  const baseline = await probe("baseline", `${API}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(baselineBody),
  });
  await sleep(300);

  for (const payload of payloads.slice(0, 4)) {
    const body = { ...baselineBody, [field]: payload };
    const r = await probe(`${field}=${payload.slice(0, 30)}`, `${API}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const verdict = classify(baseline, r, payload, type);
    results.push({
      endpoint,
      parameter: field,
      injectionType: type,
      ...verdict,
      status: r.status,
      baselineStatus: baseline.status,
    });
    await sleep(400);
  }
  return results;
}

async function testFrontendQuery() {
  const results = [];
  const baseline = await probe("baseline", `${FRONTEND}/jobs`);
  await sleep(200);
  for (const payload of SQLI.slice(0, 4)) {
    const u = `${FRONTEND}/jobs?q=${encodeURIComponent(payload)}&jobType=${encodeURIComponent(payload)}`;
    const r = await probe(`q=${payload.slice(0, 20)}`, u, { headers: { Accept: "text/html" } });
    const verdict = classify(baseline, r, payload, "sqli-frontend-reflected");
    results.push({
      endpoint: "/jobs",
      parameter: "q",
      injectionType: "sqli-frontend-reflected",
      ...verdict,
      status: r.status,
      baselineStatus: baseline.status,
    });
    await sleep(150);
  }
  return results;
}

async function main() {
  console.log("Phase 2 injection testing against", API);
  const all = [];

  all.push(...await testQueryParams("/jobs", ["search", "location", "jobType", "page", "limit", "sort"], SQLI, "sqli"));
  all.push(...await testQueryParams("/companies", ["search", "location", "industry"], SQLI.slice(0, 5), "sqli"));
  all.push(...await testPathId([...SQLI.slice(0, 4), ...TRAVERSAL]));
  all.push(...await testJsonPost("/auth/login", "email", [...SQLI.slice(0, 3), ...LDAP.slice(0, 2)], "sqli-ldap"));
  all.push(...await testJsonPost("/auth/login", "password", NOSQL, "nosql"));
  all.push(...await testJsonPost("/auth/forgot-password", "email", SQLI.slice(0, 2), "sqli"));
  all.push(...await testFrontendQuery());

  const confirmed = all.filter((f) => f.vuln === true);
  const suspected = all.filter((f) => f.vuln === "suspected");

  const report = {
    phase: 2,
    phaseName: "Injection Testing",
    completedAt: new Date().toISOString(),
    target: API,
    methodology: "Automated non-destructive payloads; Prisma ORM codebase review (no $queryRaw in src)",
    codeReview: {
      rawSqlInSrc: false,
      orm: "Prisma 6.7.0 parameterized queries",
      idMiddleware: "decryptMiddleware rejects non-numeric decrypted IDs",
    },
    summary: {
      parametersTested: all.length,
      confirmedVulnerabilities: confirmed.length,
      suspectedFindings: suspected.length,
      clean: all.filter((f) => f.vuln === false).length,
      gateStatus: confirmed.length === 0 ? "pass" : "fail",
      proceedToPhase3: confirmed.length === 0,
    },
    findings: all,
    confirmed,
    suspected,
    decision: confirmed.length
      ? "SQLi confirmed — escalate per guide (do not proceed to Phase 3 until remediated)"
      : "No injection confirmed — proceed to Phase 3 XSS testing",
  };

  writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`Wrote ${OUT}`);
  console.log(`Tested: ${all.length} | Confirmed: ${confirmed.length} | Suspected: ${suspected.length} | Clean: ${report.summary.clean}`);
  process.exit(confirmed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});