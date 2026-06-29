#!/usr/bin/env node
/**
 * Generate new app-controlled secrets after a leak. Does NOT rotate Neon/Supabase/OAuth —
 * those must be done in each provider dashboard.
 */
import { randomBytes } from "crypto";
import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, ".env.rotation");

const hex = (n) => randomBytes(n).toString("hex");

const lines = [
  "# Generated after .env.backup leak — DO NOT COMMIT",
  `# ${new Date().toISOString()}`,
  "",
  "# Paste into VPS /home/backend/nexthire/.env after dashboard rotations below",
  `JWT_SECRET=${hex(64)}`,
  `JWT_REFRESH_SECRET=${hex(64)}`,
  `SESSION_SECRET=${hex(32)}`,
  `ENCRYPTION_KEY=${hex(32)}`,
  "",
  "# Still rotate manually in provider dashboards:",
  "# - Neon: DATABASE_URL + DIRECT_URL (reset DB password)",
  "# - Supabase: SUPABASE_SERVICE_ROLE_KEY",
  "# - GitHub OAuth: GITHUB_CLIENT_SECRET",
  "# - LinkedIn OAuth: LINKEDIN_CLIENT_SECRET",
  "# - logo.dev: LOGO_DEV_TOKEN",
  "",
];

writeFileSync(out, lines.join("\n"), { encoding: "utf8", mode: 0o600 });
console.log(`Wrote ${out}`);
console.log("Run: node security/apply-vps-rotation.js");