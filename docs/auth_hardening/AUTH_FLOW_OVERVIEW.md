# Auth Flow Overview

This project uses custom backend authentication with Neon Postgres, Prisma, bcrypt, JWT access tokens, and refresh cookies.

## Login Flow

1. User submits email and password from the frontend.
2. Backend validates the request body.
3. Backend finds the user by email with Prisma.
4. Backend compares the password with the stored bcrypt hash.
5. Backend creates:
   - short-lived access token
   - longer-lived refresh token
6. Backend stores the refresh token on the user record.
7. Backend sends the refresh token in an httpOnly `jwt` cookie.
8. Backend returns the access token and user profile to the frontend.
9. Frontend stores the session in Zustand/local storage/cookies and redirects by role.

## Register Flow

1. User submits name, email, and password.
2. Backend validates the request body.
3. Backend decrypts password if the frontend sent encrypted password data.
4. Backend checks whether the email already exists.
5. Backend hashes the password with bcrypt.
6. Backend creates a `job_seeker` user by default.
7. Backend creates tokens and starts a session.

Company admins and super admins should not be created through public registration.

## Refresh Flow

1. Frontend calls `/auth/refresh` when the access token expires.
2. Backend reads the refresh token from the httpOnly `jwt` cookie.
3. Backend verifies the token.
4. Backend compares it with the refresh token stored on the user.
5. Backend creates a new access token and rotated refresh token.
6. Backend stores the new refresh token and updates the cookie.

## Logout Flow

1. Frontend calls `/auth/logout`.
2. Backend clears the stored refresh token for the current user.
3. Backend expires the `jwt` cookie.
4. Frontend clears local auth state.

## Frontend Route Protection

- `store/auth.store.ts` stores the current user and access token.
- `proxy.ts` checks dashboard routes and redirects users to the correct dashboard by role.
- `RoleGuard` protects role-specific dashboard UI.

## Backend Route Protection

- `protect.middleware.js` verifies the JWT and loads `req.user`.
- `authorize.middleware.js` checks required roles.
- Service functions enforce ownership rules such as company/job/application ownership.

## Auth Versus Authorization

Authentication answers: who is the user?

Authorization answers: what is this user allowed to do?

This app needs both because login alone is not enough. A logged-in company admin still must only manage their own company.
