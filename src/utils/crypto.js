import crypto from "crypto";

const ENCRYPTION_KEY = String(process.env.ENCRYPTION_KEY || "");

function getKey() {
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

function base64urlEncode(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(s) {
  let str = String(s).replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Buffer.from(str, "base64");
}

export function encryptId(plain) {
  if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY not configured");
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]);
  return base64urlEncode(payload);
}

export function decryptId(token) {
  if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY not configured");
  const key = getKey();
  const buf = base64urlDecode(token);
  const iv = buf.slice(0, 12);
  const tag = buf.slice(12, 28);
  const encrypted = buf.slice(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export default { encryptId, decryptId };
