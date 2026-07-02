import WebSocket from "ws";

const baseUrl = process.env.WS_URL || "ws://localhost:5000/ws";
const origin = process.env.WS_ORIGIN || "http://localhost:3000";
const timeoutMs = Number(process.env.WS_TIMEOUT_MS || 8000);

const socket = new WebSocket(baseUrl, { origin });
let settled = false;

const finish = (code, message) => {
  if (settled) return;
  settled = true;
  if (message) {
    console.log(message);
  }
  process.exit(code);
};

const timer = setTimeout(() => {
  socket.terminate();
  finish(1, `Timed out waiting for WS close with origin ${origin}`);
}, timeoutMs);

socket.on("open", () => {
  socket.close(1000, "origin probe complete");
});

socket.on("close", (code, reason) => {
  clearTimeout(timer);
  if (origin === "http://localhost:3000" || origin === "http://127.0.0.1:3000") {
    finish(0, `Allowed origin accepted: ${origin} (${code} ${reason.toString()})`);
    return;
  }

  if (code === 1008) {
    finish(0, `Blocked origin rejected as expected: ${origin}`);
    return;
  }

  finish(1, `Unexpected close code ${code} for origin ${origin} (${reason.toString()})`);
});

socket.on("error", (error) => {
  clearTimeout(timer);
  if (origin === "http://localhost:3000" || origin === "http://127.0.0.1:3000") {
    finish(1, `Allowed origin failed: ${error.message}`);
    return;
  }

  finish(0, `Blocked origin failed before upgrade as expected: ${origin}`);
});