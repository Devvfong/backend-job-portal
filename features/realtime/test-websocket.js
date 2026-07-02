import WebSocket from "ws";

const baseUrl = process.env.WS_URL || "ws://localhost:5000/ws";
const token = process.env.ACCESS_TOKEN;
const origin = process.env.WS_ORIGIN || "http://localhost:3000";

if (!token) {
  console.error("Set ACCESS_TOKEN to a valid JWT access token before running this script.");
  process.exit(1);
}

const socket = new WebSocket(baseUrl, { origin });

socket.on("open", () => {
  console.log("Socket opened, sending auth frame...");
  socket.send(JSON.stringify({ event: "auth", payload: { token } }));
});

socket.on("message", (raw) => {
  console.log("Message:", raw.toString());

  try {
    const message = JSON.parse(raw.toString());
    if (message.event === "connection:ready") {
      socket.close(1000, "smoke test complete");
    }
  } catch {
    // non-JSON frames are logged only
  }
});

socket.on("close", (code, reason) => {
  console.log(`Socket closed: ${code} ${reason.toString()}`);
  process.exit(code === 1000 ? 0 : 1);
});

socket.on("error", (error) => {
  console.error("Socket error:", error.message);
  process.exit(1);
});

setTimeout(() => {
  console.error("Timed out waiting for websocket response");
  socket.close();
  process.exit(1);
}, 10000);