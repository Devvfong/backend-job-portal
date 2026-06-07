# Deployment Checklist

This project has a Next.js frontend and an Express/Prisma backend connected to Neon Postgres.

## Frontend

Required checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Required environment:

- `NEXT_PUBLIC_API_URL`

Confirm:

- API URL points to backend `/api/v1`.
- Dashboard redirects work for all roles.
- Public job/company pages load.
- Private routes redirect unauthenticated users.

## Backend

Required checks:

```bash
npm run build
node --check src/server.js
```

Required environment:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SESSION_SECRET`
- `ENCRYPTION_KEY`
- `RSA_PRIVATE_KEY` in production
- `CORS_ORIGINS`

Confirm:

- Prisma Client is generated.
- Database connection succeeds.
- CORS allows the deployed frontend.
- Cookies work on deployed domains.
- `/api/v1/jobs`, `/api/v1/companies`, and `/api/v1/auth/me` behave as expected.

## Neon Postgres

Confirm:

- Production branch is selected.
- `DATABASE_URL` points to the right database/branch.
- Migrations are applied.
- Backups are enabled or available.

## Manual Smoke Test

1. Register/login as job seeker.
2. View jobs.
3. Apply to a job.
4. Save/unsave a job.
5. Login as company admin.
6. Create/edit job.
7. View applicants.
8. Update application status.
9. Login as super admin.
10. View/manage users and companies.

## Rollback Notes

- Keep the previous deployment available until smoke tests pass.
- Do not force-push production branches.
- If auth breaks, restore the previous backend first because frontend dashboards depend on `/auth/me`.
