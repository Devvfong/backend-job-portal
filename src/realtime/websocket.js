import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";
import { prisma } from "../config/db.js";

const WS_PATH = "/ws";
const HEARTBEAT_MS = 30000;
const REALTIME_EVENTS = {
  CONNECTION_READY: "connection:ready",
  NOTIFICATION_NEW: "notification:new",
};

const clientsByUser = new Map();
const clientsByCompany = new Map();
let wss;

const addClient = (map, key, ws) => {
  if (!key) return;
  const normalizedKey = String(key);
  const clients = map.get(normalizedKey) || new Set();
  clients.add(ws);
  map.set(normalizedKey, clients);
};

const removeClient = (map, key, ws) => {
  if (!key) return;
  const normalizedKey = String(key);
  const clients = map.get(normalizedKey);
  if (!clients) return;
  clients.delete(ws);
  if (clients.size === 0) map.delete(normalizedKey);
};

const send = (ws, event, payload) => {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ event, payload }));
};

const broadcast = (clients, event, payload) => {
  if (!clients) return;
  for (const client of clients) send(client, event, payload);
};

const authenticateAccessToken = async (request) => {
  const url = new URL(request.url, "http://localhost");
  const token = url.searchParams.get("token");

  if (!token) return null;

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (!decoded?.id || !decoded?.role) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      role: true,
      companyId: true,
      name: true,
    },
  });
};

const initRealtime = (server) => {
  wss = new WebSocketServer({ server, path: WS_PATH });

  wss.on("connection", async (ws, request) => {
    try {
      const user = await authenticateAccessToken(request);
      if (!user) {
        ws.close(1008, "Unauthorized");
        return;
      }

      ws.user = user;
      ws.isAlive = true;
      addClient(clientsByUser, user.id, ws);
      if (user.companyId) addClient(clientsByCompany, user.companyId, ws);

      send(ws, REALTIME_EVENTS.CONNECTION_READY, {
        userId: user.id,
        role: user.role,
      });

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("close", () => {
        removeClient(clientsByUser, user.id, ws);
        if (user.companyId) removeClient(clientsByCompany, user.companyId, ws);
      });
    } catch {
      ws.close(1008, "Unauthorized");
    }
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_MS);

  wss.on("close", () => clearInterval(heartbeat));
};

const sendToUser = (userId, event, payload) => {
  broadcast(clientsByUser.get(String(userId)), event, payload);
};

const sendToCompany = (companyId, event, payload) => {
  broadcast(clientsByCompany.get(String(companyId)), event, payload);
};

const emitNotificationToUser = (userId, notification) => {
  sendToUser(userId, REALTIME_EVENTS.NOTIFICATION_NEW, notification);
};

const emitNotificationToCompany = (companyId, notification) => {
  sendToCompany(companyId, REALTIME_EVENTS.NOTIFICATION_NEW, notification);
};

export {
  initRealtime,
  sendToUser,
  sendToCompany,
  emitNotificationToUser,
  emitNotificationToCompany,
  REALTIME_EVENTS,
};