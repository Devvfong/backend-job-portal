# Auth Hardening Next Steps

This backend currently uses custom authentication: email/password login, bcrypt password hashing, JWT access tokens, refresh cookies, Prisma users in Neon Postgres, role checks, and company ownership checks.

## Recommended Improvements

1. Strengthen cookie settings
   - Keep refresh tokens in an httpOnly cookie.
   - Use `secure: true` in production.
   - Use strict or intentional `sameSite` settings based on the deployed frontend/backend domains.
   - Set clear max ages for access and refresh flows.

2. Tighten refresh token rotation
   - Continue rotating refresh tokens on `/auth/refresh`.
   - Clear stored refresh tokens on logout and password reset.
   - Consider storing a hashed refresh token instead of the raw token.
   - Add token reuse detection if a rotated refresh token is used again.

3. Reduce auth logging
   - Remove noisy middleware logs from normal requests.
   - Keep only useful production-safe error logs.
   - Never log tokens, passwords, cookies, or full request headers.

4. Make role changes safer
   - Only `super_admin` should change `role` and `companyId`.
   - Prevent accidental demotion/removal of the last super admin.
   - Audit admin user changes with timestamp and actor id if possible.

5. Improve error handling
   - Return stable client messages for login/register failures.
   - Avoid leaking internal error details in production.
   - Keep detailed stack traces only in development.

6. Add auth flow documentation
   - Document login, refresh, logout, password reset, role redirects, and backend authorization.
   - Explain the difference between authentication and authorization.
   - Mention that Neon Postgres stores app users, while Express middleware enforces auth.

7. Add focused auth tests when a test framework exists
   - Login success and failure.
   - Expired/invalid token rejection.
   - Refresh token rotation.
   - Role-gated route access.
   - Company ownership checks.

## Current Auth Summary

- Identity source: `User` table in Neon Postgres via Prisma.
- Password security: bcrypt hashing.
- Session model: JWT access token plus refresh token cookie.
- Backend protection: `protect.middleware.js`.
- Role checks: `authorize.middleware.js`.
- Business authorization: service-level ownership checks for company/job/application actions.

## Do Not Change Lightly

- `User.role`
- `User.companyId`
- application ownership checks
- company job ownership checks
- refresh token handling
- `proxy.ts` dashboard role redirects in the frontend
