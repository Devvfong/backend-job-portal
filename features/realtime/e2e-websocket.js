import "dotenv/config";
import jwt from "jsonwebtoken";
import WebSocket from "ws";

const API_BASE = process.env.E2E_API_BASE || "http://localhost:5000/api/v1";
const WS_URL = process.env.E2E_WS_URL || "ws://localhost:5000/ws";

const SEEKER = { id: 226, role: "job_seeker" };
const ADMIN = { id: 184, role: "company_admin", companyId: 63 };
const SUPER_ADMIN = { id: 231, role: "super_admin" };
const JOB_ID = 371;

const results = [];

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
}

function record(name, passed, detail = "") {
  results.push({ name, passed, detail });
  const mark = passed ? "PASS" : "FAIL";
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function connectRealtime(label, token) {
  return new Promise((resolve, reject) => {
    const events = [];
    const socket = new WebSocket(WS_URL);
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error(`${label}: timed out waiting for connection:ready`));
    }, 10000);

    socket.on("open", () => {
      socket.send(JSON.stringify({ event: "auth", payload: { token } }));
    });

    socket.on("message", (raw) => {
      const message = JSON.parse(raw.toString());
      events.push(message);

      if (message.event === "connection:ready") {
        clearTimeout(timeout);
        resolve({
          label,
          socket,
          events,
          waitFor(eventName, predicate, ms = 8000) {
            return new Promise((resolveEvent, rejectEvent) => {
              const existing = events.find(
                (item) =>
                  item.event === eventName &&
                  (!predicate || predicate(item.payload)),
              );
              if (existing) {
                resolveEvent(existing);
                return;
              }

              const timer = setTimeout(() => {
                socket.off("message", onMessage);
                rejectEvent(
                  new Error(`${label}: timed out waiting for ${eventName}`),
                );
              }, ms);

              const onMessage = (data) => {
                const parsed = JSON.parse(data.toString());
                events.push(parsed);
                if (
                  parsed.event === eventName &&
                  (!predicate || predicate(parsed.payload))
                ) {
                  clearTimeout(timer);
                  socket.off("message", onMessage);
                  resolveEvent(parsed);
                }
              };

              socket.on("message", onMessage);
            });
          },
          close() {
            socket.close();
          },
        });
      }
    });

    socket.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function api(method, path, token, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: response.status, json };
}

async function run() {
  console.log("=== WebSocket E2E Test ===");
  console.log(`API: ${API_BASE}`);
  console.log(`WS:  ${WS_URL}`);
  console.log("");

  const seekerToken = signToken(SEEKER);
  const adminToken = signToken(ADMIN);
  const superAdminToken = signToken(SUPER_ADMIN);

  let seekerWs;
  let adminWs;
  let superAdminWs;
  let applicationId;

  try {
    seekerWs = await connectRealtime("seeker", seekerToken);
    adminWs = await connectRealtime("company_admin", adminToken);
    superAdminWs = await connectRealtime("super_admin", superAdminToken);
    record("WebSocket auth (3 clients)", true, "connection:ready received");

    const applyRes = await api(
      "POST",
      `/applications/job/${JOB_ID}/apply`,
      seekerToken,
      { coverLetter: "E2E websocket test" },
    );

    if (applyRes.status !== 201) {
      record(
        "Apply via HTTP",
        false,
        `status ${applyRes.status} ${JSON.stringify(applyRes.json)}`,
      );
      return;
    }

    applicationId = applyRes.json?.data?.id;
    record("Apply via HTTP", true, `applicationId=${applicationId}`);

    const seekerApplyEvent = await seekerWs.waitFor(
      "notification:new",
      (payload) =>
        payload?.applicationId === applicationId && payload?.type === "applied",
    );
    record(
      "Seeker receives apply notification",
      seekerApplyEvent.payload?.title === "Application Submitted",
      seekerApplyEvent.payload?.id,
    );

    const adminApplyEvent = await adminWs.waitFor(
      "notification:new",
      (payload) =>
        payload?.applicationId === applicationId &&
        payload?.type === "new_applicant",
    );
    record(
      "Company admin receives new applicant",
      adminApplyEvent.payload?.title === "New Applicant",
      adminApplyEvent.payload?.id,
    );

    const superApplyEvent = await superAdminWs.waitFor(
      "notification:new",
      (payload) =>
        payload?.applicationId === applicationId &&
        payload?.id?.startsWith("admin-applicant-"),
    );
    record(
      "Super admin receives platform activity",
      superApplyEvent.payload?.title === "Platform Application Activity",
      superApplyEvent.payload?.id,
    );

    const statusRes = await api(
      "PATCH",
      `/applications/${applicationId}/status`,
      adminToken,
      { status: "reviewed" },
    );
    record(
      "Status update via HTTP",
      statusRes.status === 200,
      `status ${statusRes.status}`,
    );

    const seekerStatusEvent = await seekerWs.waitFor(
      "notification:new",
      (payload) =>
        payload?.applicationId === applicationId &&
        payload?.type === "status_change",
    );
    record(
      "Seeker receives status-change notification",
      seekerStatusEvent.payload?.id === `app-reviewed-${applicationId}`,
      seekerStatusEvent.payload?.title,
    );

    const withdrawRes = await api(
      "DELETE",
      `/applications/${applicationId}`,
      seekerToken,
    );
    record(
      "Withdraw via HTTP",
      withdrawRes.status === 200,
      `status ${withdrawRes.status}`,
    );

    const seekerRemoveEvent = await seekerWs.waitFor(
      "notification:remove",
      (payload) => payload?.applicationId === applicationId,
    );
    record(
      "Seeker receives notification:remove",
      Array.isArray(seekerRemoveEvent.payload?.ids) &&
        seekerRemoveEvent.payload.ids.length > 0,
      `${seekerRemoveEvent.payload?.ids?.length || 0} ids`,
    );

    const uniqueTitle = `E2E WS Job ${Date.now()}`;
    const createJobRes = await api("POST", "/jobs/create", adminToken, {
      title: uniqueTitle,
      description: "Automated websocket end-to-end test job",
      location: "Remote",
      jobType: "remote",
      status: "open",
      salaryNegotiable: true,
    });

    const createdJobId = createJobRes.json?.data?.id;
    record(
      "Create open job via HTTP",
      createJobRes.status === 201 && !!createdJobId,
      `jobId=${createdJobId ?? "none"} status ${createJobRes.status}`,
    );

    if (createdJobId) {
      const seekerJobEvent = await seekerWs.waitFor(
        "notification:new",
        (payload) =>
          payload?.jobId === createdJobId && payload?.type === "new_job",
      );
      record(
        "Seeker receives new job notification",
        seekerJobEvent.payload?.id === `new-job-${createdJobId}`,
        seekerJobEvent.payload?.title,
      );

      await api("DELETE", `/jobs/${createdJobId}`, adminToken);
    }

    const httpNotifications = await api("GET", "/notifications", seekerToken);
    const httpList = httpNotifications.json?.data || [];
    record(
      "HTTP notifications fallback",
      httpNotifications.status === 200 && Array.isArray(httpList),
      `${httpList.length} items`,
    );
  } catch (error) {
    record(
      "Unhandled test error",
      false,
      error?.message || error?.code || String(error),
    );
  } finally {
    seekerWs?.close();
    adminWs?.close();
    superAdminWs?.close();
    await wait(300);
  }

  console.log("");
  const passed = results.filter((item) => item.passed).length;
  const failed = results.filter((item) => !item.passed).length;
  console.log(`=== Summary: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) {
    process.exit(1);
  }
}

run();