#!/usr/bin/env node
/**
 * Scan entire git history for likely credential leaks.
 * Usage: node security/scan-git-history.js [repoPath]
 */
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const repo = process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const PATTERNS = [
  { id: "neon-password", re: /npg_[A-Za-z0-9]+/ },
  { id: "postgres-url", re: /postgresql:\/\/[^\s"']+:[^\s"']+@/ },
  { id: "jwt-supabase", re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { id: "github-oauth-secret-hex", re: /GITHUB_CLIENT_SECRET=[0-9a-f]{20,}/i },
  { id: "linkedin-secret", re: /LINKEDIN_CLIENT_SECRET=WPL_AP1\./ },
  { id: "env-backup-file", re: /\.env\.backup/ },
  { id: "rsa-private-key", re: /BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY/ },
  { id: "jwt-secret-hex64", re: /JWT_SECRET="[0-9a-f]{64,}"/i },
];

function sh(cmd) {
  return execSync(cmd, { cwd: repo, encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
}

const commits = sh("git rev-list --all").trim().split(/\r?\n/).filter(Boolean);
const hits = [];

for (const commit of commits) {
  let names = [];
  try {
    names = sh(`git diff-tree --no-commit-id --name-only -r ${commit}`)
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    continue;
  }
  for (const file of names) {
    if (file.includes("node_modules/")) continue;
    let content = "";
    try {
      content = sh(`git show ${commit}:${file}`);
    } catch {
      continue;
    }
    for (const p of PATTERNS) {
      if (p.re.test(content)) {
        hits.push({ commit: commit.slice(0, 12), file, pattern: p.id });
      }
    }
  }
}

const unique = [...new Map(hits.map((h) => [`${h.commit}:${h.file}:${h.pattern}`, h])).values()];

console.log(`Repo: ${repo}`);
console.log(`Commits scanned: ${commits.length}`);
console.log(`Hits: ${unique.length}`);
if (unique.length) {
  for (const h of unique.slice(0, 50)) {
    console.log(`  ${h.pattern}  ${h.commit}  ${h.file}`);
  }
  if (unique.length > 50) console.log(`  ... +${unique.length - 50} more`);
  process.exit(1);
}
console.log("No credential patterns found in history.");
process.exit(0);