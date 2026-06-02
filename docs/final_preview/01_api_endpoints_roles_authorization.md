# API Endpoints, Roles, and Authorization

Base API URL:

```text
/api/v1
```

Authentication supports Bearer access tokens and the `jwt` HTTP-only refresh cookie. Protected routes use `protect`; role-gated routes use `authorize(...)`. The `authorize` middleware lets `super_admin` pass every role-gated route, but service-level ownership checks may still apply.

## Roles

| Role | Purpose |
| --- | --- |
| `job_seeker` | Register, login, manage own profile, browse jobs, save jobs, apply to jobs, withdraw own applications. |
| `company_admin` | Manage linked company, company assets, company jobs, applicants, and application statuses. |
| `super_admin` | Global administrative role. Route authorization allows super admin through admin and company-admin routes. Some current service-level ownership checks still need explicit `super_admin` handling before every super-admin workflow works end to end. |

## Public and Documentation

| Method | Path | Auth | Roles | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/openapi.json` | Conditional | `company_admin`, `super_admin` unless `DOCS_PUBLIC=true/1/yes` | Return OpenAPI document. |
| `GET` | `/docs` | Conditional | `company_admin`, `super_admin` unless `DOCS_PUBLIC=true/1/yes` | Scalar API documentation UI. |

## Auth

| Method | Path | Auth | Roles | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Public, rate limited | Public | Register a `job_seeker`; password may be plain or RSA-encrypted. |
| `POST` | `/api/v1/auth/login` | Public, rate limited | Public | Login, set refresh cookie, return access token. |
| `GET` | `/api/v1/auth/me` | Required | Any authenticated user | Return current user from token. |
| `POST` | `/api/v1/auth/refresh` | Refresh cookie required | Any authenticated user with valid stored refresh token | Rotate refresh token and return new access token. |
| `POST` | `/api/v1/auth/logout` | Required | Any authenticated user | Clear stored refresh token and cookie. |

## OAuth

These routes are mounted outside `/api/v1`.

| Method | Path | Auth | Roles | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/auth/github` | Public | Public | Start GitHub OAuth login. |
| `GET` | `/auth/github/callback` | GitHub OAuth | OAuth user | Create tokens and redirect to frontend callback. |
| `GET` | `/auth/linkedin` | Public | Public | Start LinkedIn OAuth login. |
| `GET` | `/auth/linkedin/callback` | LinkedIn OAuth | OAuth user | Create tokens and redirect to frontend callback. |

## Users

| Method | Path | Auth | Roles | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/users/profile` | Required | Any authenticated user | Get current user's profile. |
| `GET` | `/api/v1/users/profile/:id` | Public | Public | Get public profile by numeric or encrypted ID. Response is sanitized and excludes private fields such as email, phone, resume, role, and company ID. |
| `GET` | `/api/v1/users/me/stats` | Required | Any authenticated user | Get application count, saved job count, and profile strength. |
| `POST` | `/api/v1/users/profile` | Required | Any authenticated user | Initialize/update current user's profile fields. |
| `PUT` | `/api/v1/users/profile` | Required | Any authenticated user | Update current user's profile. |
| `GET` | `/api/v1/users` | Required | `super_admin` | List users. |
| `PUT` | `/api/v1/users/profile/:id` | Required | `super_admin` | Update any user's profile. Super admins may update `role` and `companyId`; service checks the literal `super_admin` role. |
| `DELETE` | `/api/v1/users/:id` | Required | `super_admin` | Delete a user and clean up avatar/resume files. |
| `POST` | `/api/v1/users/avatar` | Required | Any authenticated user | Upload current user's avatar. |
| `POST` | `/api/v1/users/resume` | Required | Any authenticated user | Upload current user's resume. |

## Companies

| Method | Path | Auth | Roles | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/companies` | Public | Public | List companies with search, filters, pagination, and sorting. |
| `POST` | `/api/v1/companies/create` | Required | `company_admin`, `super_admin` by service logic | Create company. This route does not call `authorize(...)`; `createCompanyService` enforces the allowed roles. A company admin can create only if not already linked. |
| `GET` | `/api/v1/companies/:id` | Public | Public | Get company by numeric or encrypted ID. Sensitive email is included only when `req.user` is present and authorized, but route does not run `protect`, so this is effectively public data only. |
| `PUT` | `/api/v1/companies/:id` | Required | Owner `company_admin` or `super_admin` by service logic | Update company. Company identity changes require super admin. |
| `DELETE` | `/api/v1/companies/:id` | Required | Owner `company_admin` or `super_admin` by service logic | Delete company. Jobs cascade through the Prisma relation; user company links are not described as a business workflow here and should be verified before destructive production use. |
| `GET` | `/api/v1/companies/me` | Required | `company_admin` | Get current admin's linked company. |
| `PUT` | `/api/v1/companies/me` | Required | `company_admin` | Update current admin's linked company. |
| `GET` | `/api/v1/companies/me/stats` | Required | `company_admin` | Get active jobs, total applications, and application status summary. |
| `GET` | `/api/v1/companies/me/jobs` | Required | `company_admin` | Get jobs for current admin's linked company. |
| `POST` | `/api/v1/companies/logo` | Required | `company_admin` | Upload logo file. |
| `DELETE` | `/api/v1/companies/logo` | Required | `company_admin` | Remove logo and record deleted Supabase asset path. |
| `POST` | `/api/v1/companies/cover` | Required | `company_admin` | Upload cover image. |
| `DELETE` | `/api/v1/companies/cover` | Required | `company_admin` | Remove cover image and record deleted Supabase asset path. |
| `POST` | `/api/v1/companies/upload` | Required | `company_admin` | Upload a gallery asset. |

## Jobs

| Method | Path | Auth | Roles | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/jobs` | Public | Public | List open jobs with search, filters, pagination, and sorting. |
| `GET` | `/api/v1/jobs/saved` | Required | Any authenticated user | Get current user's saved jobs. |
| `GET` | `/api/v1/jobs/:id` | Public | Public | Get one open job by numeric or encrypted ID. |
| `POST` | `/api/v1/jobs/create` | Required | `company_admin`, `super_admin` through route authorization | Create job. Service uses `data.companyId || user.companyId`; super admin must provide `companyId` unless linked to a company. |
| `PUT` | `/api/v1/jobs/:id` | Required | Owner `company_admin` or `super_admin` | Update job. `super_admin` can also change `companyId`. |
| `DELETE` | `/api/v1/jobs/:id` | Required | Owner `company_admin` or `super_admin` | Delete job. |
| `POST` | `/api/v1/jobs/:id/save` | Required | Any authenticated user | Toggle saved/unsaved job. |

## Applications

| Method | Path | Auth | Roles | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/api/v1/applications/job/:id/apply` | Required | Any authenticated user | Apply to an open job. Duplicate applications are blocked by DB unique constraint. |
| `GET` | `/api/v1/applications/me` | Required | Any authenticated user | Get current user's applications. |
| `DELETE` | `/api/v1/applications/:id` | Required | Application owner | Withdraw current user's own application. |
| `GET` | `/api/v1/applications/company` | Required | `company_admin`; route middleware also lets `super_admin` pass | Get applicants for current admin's company. Super admins can view all applications without a company link. |
| `GET` | `/api/v1/applications/job/:id/applicants` | Required | `company_admin`; route middleware also lets `super_admin` pass | Get applicants for a company-owned job. Super admins bypass company ownership at the service layer. |
| `PATCH` | `/api/v1/applications/:id/status` | Required | `company_admin`; route middleware also lets `super_admin` pass | Update application status. Request body is validated against the application status enum before Prisma writes. |

## Lookup, Stats, and Notifications

| Method | Path | Auth | Roles | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/categories` | Public | Public | Return job categories grouped from non-null `Job.category` values, with counts. |
| `GET` | `/api/v1/locations` | Public | Public | Return up to 6 grouped job locations with job counts and fallback image URLs. |
| `GET` | `/api/v1/stats` | Public | Public | Return global counts for jobs, companies, users, and applications. Counts are not limited to open jobs. |
| `GET` | `/api/v1/notifications` | Required | Any authenticated user | Return generated notifications based on application/job data. |

## ID Handling

Most `:id` routes use `decryptMiddleware`. Numeric IDs pass through unchanged. Non-numeric IDs are decrypted with `decryptId`; invalid encrypted IDs return `400`.

Responses often include `encryptedId` for frontend routing. Some responses still include raw numeric IDs, so privacy and consistency should be reviewed before final release.

## Frontend Implementation Notes

- `validate.middleware.js` replaces `req.body` with the parsed Zod result. Fields not declared in a route schema are stripped before controllers/services receive them.
- `POST /api/v1/users/profile` currently validates `name` and `email` as required, but `createProfile()` only updates profile fields such as `headline`, `bio`, `location`, `phone`, `avatar`, `skills`, and `resume`.
- `PUT /api/v1/users/profile/:id` supports super-admin profile updates, including `role` and `companyId`. Use `null` for `companyId` to unlink a user from a company.
- Company update routes support only fields present in `createCompanySchema`. Current validation accepts `companyName`, `description`, `location`, `website`, `industry`, `size`, `logo`, `email`, `foundedYear`, `officeCount`, `gallery`, and `specialties`. Fields such as `mapUrl`, `latitude`, and `longitude` exist in the database/service but are stripped by current route validation.
- Job create/update validation accepts `title`, `description`, `location`, `jobType`, `requirements`, `benefits`, `salaryNegotiable`, `salaryMin`, `salaryMax`, `companyId`, and `status`. Fields such as `category`, `skills`, and `tags` exist in the database/service but are not accepted by the current job route schema.
