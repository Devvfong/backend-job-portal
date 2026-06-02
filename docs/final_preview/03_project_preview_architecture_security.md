# Project Preview, Architecture, and Security Notes

This document summarizes the current backend as it exists in code, not the older generic docs.

## Runtime Stack

| Area | Current Implementation |
| --- | --- |
| Server | Express 5 app in `src/server.js` |
| Database | PostgreSQL with Prisma Client from `src/config/db.js` |
| Auth | JWT access token plus refresh token stored in `jwt` HTTP-only cookie |
| Sessions | `express-session` with `connect-pg-simple` table `session` |
| Validation | Zod schemas in route files plus `validate.middleware.js` |
| Uploads | Multer memory storage and Supabase upload services |
| Docs | OpenAPI document from `src/utils/openapi.js`, served by Scalar at `/docs` |
| Security middleware | `helmet`, CORS allowlist, auth rate limiting |
| Background cleanup | Cron job in `src/utils/cron.js` |

## Request Flow

```text
Client
  -> Express route
  -> middleware: validation, auth, role checks, decryption, upload parsing
  -> controller
  -> service
  -> Prisma
  -> PostgreSQL
```

Controllers handle HTTP status and response shape. Services handle database and business rules. Middleware handles reusable request checks.

## Important Middleware

| Middleware | Purpose |
| --- | --- |
| `protect.middleware.js` | Reads Bearer token or `jwt` cookie, verifies JWT, loads user from Prisma, attaches `req.user`. |
| `authorize.middleware.js` | Requires one of the listed roles; `super_admin` bypasses all role lists. |
| `validate.middleware.js` | Validates request body with Zod. |
| `decrypt.middleware.js` | Converts encrypted route `:id` params to numeric IDs. |
| `upload.middleware.js` | Handles avatar, resume, logo, cover, and company asset uploads. |

## Current Auth Behavior

- Access tokens expire after `5m`.
- Refresh tokens expire after `1d`.
- Refresh tokens are stored in the `jwt` cookie and persisted in `User.refreshToken`.
- `/api/v1/auth/refresh` validates the cookie token against the stored token and rotates it.
- Register always creates `job_seeker`; company admins and super admins must be created or promoted through admin/database flows.
- Passwords may be sent plain or RSA-encrypted. Production requires `RSA_PRIVATE_KEY`.

## Current File and Asset Behavior

- Avatar, resume, logo, cover, and gallery uploads use memory storage before upload to Supabase.
- Avatar, logo, cover, and resume handlers clean up or record old assets.
- `DeletedAsset` records are used for delayed cleanup of Supabase paths.
- Company logo and cover upload file size limit is `5MB`.
- Supported image MIME types: JPEG, JPG, PNG, WebP, HEIC.
- Resume uploads accept `.pdf`, `.doc`, and `.docx` by extension.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `JWT_SECRET` | Access token signing secret. |
| `JWT_REFRESH_SECRET` | Refresh token signing secret; falls back to `JWT_SECRET`. |
| `SESSION_SECRET` | Express session secret; should always be set outside development. |
| `RSA_PRIVATE_KEY` | Required in production for encrypted password support. |
| `ENCRYPTION_KEY` | Used by app ID encryption/decryption helpers. |
| `NEXT_PUBLIC_ENCRYPTION_KEY` | Compared with backend encryption key for deployment sanity checks. |
| `FRONTEND_URL` | OAuth callback redirect base URL. |
| `DOCS_PUBLIC` | Makes `/docs` and `/openapi.json` public when `true`, `1`, or `yes`. |
| `LOGO_DEV_TOKEN` | Used to build logo.dev fallback logo URLs. |
| `SUPABASE_*` | Supabase connection and storage credentials. |
| `GITHUB_*`, `LINKEDIN_*` | OAuth provider credentials. |

## Current Security Review Notes

These are important before a final production release:

1. `GET /api/v1/users/profile/:id` now uses a public-only selector and excludes private fields such as email, phone, resume, role, and company ID.
2. Service-level super-admin behavior now uses the literal `super_admin` role instead of `process.env.SERVER`.
3. Application applicant/status services include explicit service-level `super_admin` handling where route authorization allows that role.
4. `PATCH /api/v1/applications/:id/status` validates status with the `ApplicationStatus` enum values before Prisma writes.
5. Review responses for raw numeric IDs if the frontend expects only encrypted IDs.
6. `README.md` has been replaced with a concise current backend guide.
7. Keep `docs/final_preview` tracked in Git. The root `.gitignore` allows this folder, while other generated docs remain ignored.

## Recommended Final Checks

Run these before final submission or deployment:

```bash
npx prisma generate
npm run build
npm run start
```

Also manually verify:

- Register, login, refresh, logout.
- Public job and company browsing.
- Company admin company create/update/upload flows.
- Job create/update/delete by owner.
- Application submit, withdraw, applicant list, and status update.
- Super admin user management.
- `/docs` and `/openapi.json` behavior with `DOCS_PUBLIC` both enabled and disabled.

## Final Documentation Set

Use these files as the current project reference:

```text
docs/final_preview/01_api_endpoints_roles_authorization.md
docs/final_preview/02_database_relationships.md
docs/final_preview/03_project_preview_architecture_security.md
```
