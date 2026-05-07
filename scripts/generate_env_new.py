#!/usr/bin/env python3
import secrets
from pathlib import Path

repo_root = Path(__file__).resolve().parents[1]
env_path = repo_root / ".env.new"

def token_urlsafe(n=32):
    return secrets.token_urlsafe(n)

def token_hex(n=32):
    return secrets.token_hex(n)

secrets_map = {
    "NEON_API_KEY": token_urlsafe(32),
    "SUPABASE_SERVICE_ROLE_KEY": token_urlsafe(48),
    "OAUTH_GITHUB_CLIENT_SECRET": token_urlsafe(32),
    "LINKEDIN_CLIENT_SECRET": token_urlsafe(32),
    "JWT_SECRET": token_hex(32),
    "JWT_REFRESH_SECRET": token_hex(32),
    "SESSION_SECRET": token_hex(32),
    "ENCRYPTION_KEY": token_urlsafe(32),
    "LOGO_DEV_TOKEN": token_urlsafe(24),
    "DB_PASSWORD": token_urlsafe(16),
}

lines = []
lines.append("# GENERATED: DO NOT COMMIT. Review and replace placeholders before use.")
lines.append("# Replace REPLACE_HOST with your Neon DB host and adjust user/name as needed.")
lines.append('DATABASE_URL="postgresql://neondb_owner:{DB_PASSWORD}@REPLACE_HOST:5432/neondb?sslmode=require&channel_binding=require"'.format(**secrets_map))
for k, v in secrets_map.items():
    lines.append(f"{k}={v}")

env_path.write_text("\n".join(lines))
print(f"Wrote: {env_path}")
print("Note: .env.new matches .env.* in .gitignore and should not be committed.")
