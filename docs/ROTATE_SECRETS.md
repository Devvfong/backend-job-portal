# Rotate exposed credentials — quick guide

If any secrets were exposed in the repo or logs, rotate them immediately. Below are provider-specific pointers and general steps.

1) Neon (Postgres)
- Console: https://console.neon.tech → Project → Settings → API keys / Service tokens. Revoke exposed keys and create new ones.
- For DB user/password (in `DATABASE_URL`): create a new DB role/password in Neon or reset the password for the role used, then update your `.env` and CI secrets.

2) Supabase
- Dashboard → Project → Settings → API → Revoke the `SERVICE_ROLE` key and create a new one. Update your server env and CI secrets immediately.

3) OAuth clients (GitHub, LinkedIn)
- GitHub: Settings → Developer settings → OAuth Apps → select app → **Reset client secret**.
- LinkedIn: LinkedIn Developer Portal → Auth settings → rotate secret.
- After rotation, update `GITHUB_CLIENT_SECRET`, `LINKEDIN_CLIENT_SECRET` in your environment and CI secrets.

4) GitHub Actions / CI secrets
- Repo → Settings → Secrets and variables → Actions → remove old secrets and add new values (e.g., `NEON_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

5) JWT / Session / Encryption keys
- Generate new secure random keys (at least 32 bytes base64 or hex). Replace `JWT_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY` in environment stores and deploy.

6) Database credentials
- Rotate DB user passwords and update `DATABASE_URL` in `.env` and CI. If possible, create a least-privilege role for the app (no superuser).

7) After rotation
- Verify application starts and can connect using the new credentials in a staging environment before updating production.
- Revoke the old keys and invalidate sessions if applicable (force logout).

8) Optional: audit logs and monitor
- Check provider audit logs for suspicious activity around the time of the leak.
- Enable alerts for unusual usage (e.g., new tokens created, failed logins, elevated API usage).

If you want, I can prepare environment updates for your CI (example GitHub Actions secrets update commands) or generate secure random secrets for you (`generate-secrets`).
