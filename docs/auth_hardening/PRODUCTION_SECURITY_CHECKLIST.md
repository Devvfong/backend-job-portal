# Production Security Checklist

Use this checklist before deploying or handing the project to another developer.

## Required Environment Variables

Backend:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_SECRET`
- `ENCRYPTION_KEY`
- `RSA_PRIVATE_KEY` in production
- `CORS_ORIGINS`
- email provider keys if password reset emails are enabled

Frontend:

- `NEXT_PUBLIC_API_URL`
- frontend encryption key if encrypted password flow is enabled

## Secrets

- Never commit `.env`.
- Never commit `.pem`, `.key`, `.crt`, or other private keys.
- Rotate secrets if they were ever exposed.
- Use separate secrets for development and production.

## Cookies

- Refresh token cookie should be httpOnly.
- Use `secure: true` in production.
- Set intentional `sameSite`.
- Keep token expiry short enough to limit risk.

## CORS

- Allow only trusted frontend domains.
- Include local origins only for development.
- Keep `credentials: true` only when cookies are required.

## Auth

- Rate limit login and password reset routes.
- Do not reveal whether an email exists during password reset.
- Clear refresh tokens on logout and password reset.
- Prevent company admins from mutating other companies.
- Prevent non-seekers from applying/saving jobs.

## SEO / Crawler Safety

- Public pages can be indexed.
- Dashboards, auth routes, API routes, and docs should be noindex.
- Backend should send `X-Robots-Tag` for private/API/docs surfaces.

## Build Checks

Frontend:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Backend:

```bash
npm run build
node --check src/server.js
```

If Prisma generate fails on Windows with an `EPERM` rename error, stop the running backend process and retry.
