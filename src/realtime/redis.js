import { createClient } from "redis";
import {
  sendToUser,
  sendToCompany,
  sendToRole,
  broadcastToAllLocal,
  REALTIME_EVENTS,
} from "./websocket.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let pubClient;
let subClient;

const initRedis = async () => {
  pubClient = createClient({ url: REDIS_URL });
  subClient = createClient({ url: REDIS_URL });

  pubClient.on("error", (err) => console.error("Redis PubClient Error", err));
  subClient.on("error", (err) => console.error("Redis SubClient Error", err));

  await Promise.all([pubClient.connect(), subClient.connect()]);

  console.log("Redis Pub/Sub connected successfully");

  await subscribeToEvents();
};

const CHANNELS = {
  USER: "notify:user",
  COMPANY: "notify:company",
  ROLE: "notify:role",
  BROADCAST: "notify:broadcast",
};

const publishEvent = async (channel, message) => {
  if (!pubClient?.isOpen) {
    console.warn("Redis pubClient is not open. Event may be dropped.");
    return;
  }
  await pubClient.publish(channel, JSON.stringify(message));
};

const subscribeToEvents = async () => {
  if (!subClient?.isOpen) return;

  await subClient.subscribe(CHANNELS.USER, (messageStr) => {
    try {
      const { userId, event, payload } = JSON.parse(messageStr);
      sendToUser(userId, event, payload);
    } catch (error) {
      console.error("Failed to process USER channel message", error);
    }
  });

  await subClient.subscribe(CHANNELS.COMPANY, (messageStr) => {
    try {
      const { companyId, event, payload } = JSON.parse(messageStr);
      sendToCompany(companyId, event, payload);
    } catch (error) {
      console.error("Failed to process COMPANY channel message", error);
    }
  });

  await subClient.subscribe(CHANNELS.ROLE, (messageStr) => {
    try {
      const { role, event, payload } = JSON.parse(messageStr);
      sendToRole(role, event, payload);
    } catch (error) {
      console.error("Failed to process ROLE channel message", error);
    }
  });

  await subClient.subscribe(CHANNELS.BROADCAST, (messageStr) => {
    try {
      const { event, payload } = JSON.parse(messageStr);
      broadcastToAllLocal(event, payload);
    } catch (error) {
      console.error("Failed to process BROADCAST channel message", error);
    }
  });
};

export { initRedis, publishEvent, CHANNELS };
