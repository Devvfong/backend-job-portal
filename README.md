# NextHire Backend

Express 5 API for the NextHire application, backed by PostgreSQL and Prisma.

## Stack

- Express 5
- Prisma Client
- PostgreSQL
- JWT access tokens and HTTP-only refresh cookies
- Zod request validation
- Multer memory uploads with Supabase storage
- Scalar API docs at `/docs`

## Setup

```bash
npm install
npx prisma generate
npm run dev
```

Copy `.env.example` to `.env` and configure the required secrets before running locally.

## Useful Commands

```bash
npm run dev      # start development server
npm run build    # generate Prisma client
npm run start    # start production server
```

## Reference Docs

Use the final preview docs as the current backend reference:

- `docs/final_preview/01_api_endpoints_roles_authorization.md`
- `docs/final_preview/02_database_relationships.md`
- `docs/final_preview/03_project_preview_architecture_security.md`

## Validation Notes

Before deployment, run:

```bash
npx prisma generate
npm run build
npm run start
```

Then manually verify authentication, public browsing, company admin workflows, applications, super-admin user management, and `/docs` / `/openapi.json` visibility.
