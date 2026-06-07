import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";
import { prisma } from "../config/db.js";

const WS_PATH = "/ws";
const HEARTBEAT_MS = 30000;
const AUTH_TIMEOUT_MS = 10000;
const REALTIME_EVENTS = {
  AUTH: "auth",
  CONNECTION_READY: "connection:ready",
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_REMOVE: "notification:remove",
};

const clientsByUser = new Map();
const clientsByCompany = new Map();
const clientsByRole = new Map();
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

const verifyAccessToken = async (token) => {
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

const registerClient = (ws, user) => {
  ws.user = user;
  ws.isAlive = true;
  ws.authenticated = true;

  addClient(clientsByUser, user.id, ws);
  if (user.companyId) addClient(clientsByCompany, user.companyId, ws);
  addClient(clientsByRole, user.role, ws);

  send(ws, REALTIME_EVENTS.CONNECTION_READY, {
    userId: user.id,
    role: user.role,
  });
};

const unregisterClient = (ws) => {
  const user = ws.user;
  if (!user) return;

  removeClient(clientsByUser, user.id, ws);
  if (user.companyId) removeClient(clientsByCompany, user.companyId, ws);
  removeClient(clientsByRole, user.role, ws);
};

const authenticateFromRequest = async (request) => {
  const url = new URL(request.url, "http://localhost");
  const token = url.searchParams.get("token");
  if (!token) return null;
  return verifyAccessToken(token);
};

const initRealtime = (server) => {
  wss = new WebSocketServer({ server, path: WS_PATH });

  wss.on("connection", async (ws, request) => {
    let authTimer = null;

    const closeUnauthorized = (reason = "Unauthorized") => {
      if (authTimer) clearTimeout(authTimer);
      ws.close(1008, reason);
    };

    const completeAuth = async (token) => {
      try {
        const user = await verifyAccessToken(token);
        if (!user) {
          closeUnauthorized();
          return;
        }

        if (authTimer) clearTimeout(authTimer);
        registerClient(ws, user);
      } catch {
        closeUnauthorized();
      }
    };

    ws.on("error", () => {
      unregisterClient(ws);
    });

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("close", () => {
      if (authTimer) clearTimeout(authTimer);
      unregisterClient(ws);
    });

    ws.on("message", async (rawMessage) => {
      if (ws.authenticated) return;

      try {
        const message = JSON.parse(String(rawMessage));
        if (message?.event !== REALTIME_EVENTS.AUTH || !message?.payload?.token) {
          closeUnauthorized();
          return;
        }

        await completeAuth(message.payload.token);
      } catch {
        closeUnauthorized();
      }
    });

    try {
      const user = await authenticateFromRequest(request);
      if (user) {
        registerClient(ws, user);
        return;
      }

      authTimer = setTimeout(() => {
        if (!ws.authenticated) closeUnauthorized("Auth timeout");
      }, AUTH_TIMEOUT_MS);
    } catch {
      closeUnauthorized();
    }
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        unregisterClient(ws);
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

const sendToRole = (role, event, payload) => {
  broadcast(clientsByRole.get(String(role)), event, payload);
};

const emitNotificationToUser = (userId, notification) => {
  sendToUser(userId, REALTIME_EVENTS.NOTIFICATION_NEW, notification);
};

const emitNotificationToCompany = (companyId, notification) => {
  sendToCompany(companyId, REALTIME_EVENTS.NOTIFICATION_NEW, notification);
};

const emitNotificationToRole = (role, notification) => {
  sendToRole(role, REALTIME_EVENTS.NOTIFICATION_NEW, notification);
};

const removeNotificationFromUser = (userId, payload) => {
  sendToUser(userId, REALTIME_EVENTS.NOTIFICATION_REMOVE, payload);
};

export {
  initRealtime,
  sendToUser,
  sendToCompany,
  sendToRole,
  emitNotificationToUser,
  emitNotificationToCompany,
  emitNotificationToRole,
  removeNotificationFromUser,
  REALTIME_EVENTS,
};