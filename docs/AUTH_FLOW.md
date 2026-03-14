# Auth Flow: Routes, Middleware, Controller, Service

This document explains how each auth layer works together in this project.

## Relationship Between Layers

Request flow:

1. Route receives HTTP request.
2. Middleware validates input and can stop bad requests early.
3. Controller handles request/response logic.
4. Service handles database and business logic.
5. Utility helps with reusable helpers (for example JWT token creation).

Simple map:

Client -> Route -> Middleware -> Controller -> Service -> Prisma/Database

Response flow:

Database -> Service -> Controller -> Client

## Current Files In This Project

- src/routes/auth.routes.js
- src/middlewares/validate.middleware.js
- src/controllers/auth.controller.js
- src/services/auth.service.js
- src/utils/generateToken.js

## What Each Layer Should Do

### Route

- Define endpoint path and HTTP method.
- Attach middleware.
- Call controller.

Example:

- POST /register -> validate(registerSchema) -> register controller
- POST /login -> validate(loginSchema) -> login controller
- POST /logout -> logout controller

### Middleware

- Reusable request checks.
- Keep controller clean.
- Return 400/401 before controller if invalid.

Current middleware example:

- validate(schema): validates req.body with Zod.

### Controller

- Read req data.
- Call service functions.
- Decide HTTP status code and response shape.
- Handle try/catch for request-level errors.

### Service

- Contains DB logic and business logic.
- No direct HTTP response handling.
- Reused by multiple controllers/middlewares.

Current service examples:

- findUserByEmail(email)
- createUser({ name, email, password })
- verifyPassword(plainPassword, hashedPassword)

## Example: Register

Endpoint: POST /register

1. Route applies validate(registerSchema).
2. Middleware checks name/email/password format.
3. Controller calls findUserByEmail(email).
4. If user exists -> return 400.
5. Controller calls createUser(...).
6. Service hashes password and creates user in DB.
7. Controller calls generateToken(user.id, res).
8. Utility sets jwt cookie and returns token.
9. Controller returns 201 with user + token.

## Example: Login

Endpoint: POST /login

1. Route applies validate(loginSchema).
2. Middleware checks email/password format.
3. Controller calls findUserByEmail(email).
4. If user not found -> return 400.
5. Controller calls verifyPassword(password, user.password).
6. If password invalid -> return 400.
7. Controller calls generateToken(user.id, res).
8. Utility sets jwt cookie and returns token.
9. Controller returns 200 with user + token.

## Example: Logout

Endpoint: POST /logout

1. Controller clears jwt cookie by setting an expired value.
2. Controller returns 200 success response.

## Quick Rule Of Thumb

- Put it in middleware if logic is reusable request validation/auth check.
- Put it in service if logic is DB/business and may be reused.
- Keep controller focused on request -> service -> response.
