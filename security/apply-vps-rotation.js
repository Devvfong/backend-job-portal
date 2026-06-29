#!/usr/bin/env node
/**
 * Merge .env.rotation into VPS /home/backend/nexthire/.env (app secrets only).
 */
import { readFileSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const rotationPath = path.join(root, ".env.rotation");
const VPS = process.env.VPS_HOST || "root@143.198.86.248";
const ENV_PATH = process.env.VPS_ENV_PATH || "/home/backend/nexthire/.env";

const KEYS = ["JWT_SECRET", "JWT_REFRESH_SECRET", "SESSION_SECRET", "ENCRYPTION_KEY"];

function syncPublicEncryptionKey(map) {
  if (map.has("ENCRYPTION_KEY")) {
    map.set("NEXT_PUBLIC_ENCRYPTION_KEY", map.get("ENCRYPTION_KEY"));
  }
}

function parseEnv(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    map.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
  }
  return map;
}

function mergeEnv(baseText, updates) {
  const lines = baseText.split(/\r?\n/);
  const seen = new Set();
  const out = lines.map((line) => {
    if (!line || line.startsWith("#")) return line;
    const idx = line.indexOf("=");
    if (idx === -1) return line;
    const key = line.slice(0, idx).trim();
    if (updates.has(key)) {
      seen.add(key);
      return `${key}=${updates.get(key)}`;
    }
    return line;
  });
  for (const [key, value] of updates) {
    if (!seen.has(key)) {
      out.push(`${key}=${value}`);
    }
  }
  return `${out.join("\n").replace(/\n*$/, "")}\n`;
}

const rotation = parseEnv(readFileSync(rotationPath, "utf8"));
const updates = new Map();
for (const key of KEYS) {
  if (rotation.has(key)) updates.set(key, rotation.get(key));
}
if (updates.size !== KEYS.length) {
  console.error("Missing keys in .env.rotation — run: node security/generate-rotation-secrets.js");
  process.exit(1);
}
syncPublicEncryptionKey(updates);

const remote = execSync(`ssh -o BatchMode=yes ${VPS} "cat ${ENV_PATH}"`, { encoding: "utf8" });
const merged = mergeEnv(remote, updates);
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
execSync(`ssh -o BatchMode=yes ${VPS} "cp ${ENV_PATH} ${ENV_PATH}.bak-${stamp}"`, { stdio: "inherit" });

const b64 = Buffer.from(merged, "utf8").toString("base64");
execSync(
  `ssh -o BatchMode=yes ${VPS} "echo ${b64} | base64 -d > ${ENV_PATH}"`,
  { stdio: "inherit" },
);

execSync(
  `ssh -o BatchMode=yes ${VPS} "docker restart nexthire-backend"`,
  { stdio: "inherit" },
);

console.log(`Updated ${[...updates.keys()].join(", ")} on ${VPS}:${ENV_PATH}`);
console.log(`Backup: ${ENV_PATH}.bak-${stamp}`);
console.log("All users must log in again (JWT rotated).");