# Database and Relationships

The database uses PostgreSQL through Prisma. The current schema lives at:

```text
prisma/schema.prisma
```

## Models

| Model | Purpose |
| --- | --- |
| `User` | Stores accounts, credentials, profile fields, role, refresh token, optional company link, applications, and saved jobs. |
| `Company` | Stores company identity, profile, branding/media, location/map fields, jobs, and linked users/admins. |
| `Job` | Stores company-owned job postings, compensation fields, open/closed status, skills, tags, applications, and saved-job links. |
| `Application` | Connects a user to a job with an application status and optional cover letter. |
| `SavedJob` | Connects a user to a saved job. |
| `Session` | Stores Express session data through `connect-pg-simple`; mapped to table `session`. |
| `DeletedAsset` | Tracks Supabase asset paths for delayed cleanup; mapped to table `deleted_assets`. |

## Enums

| Enum | Values |
| --- | --- |
| `Role` | `job_seeker`, `company_admin`, `super_admin` |
| `JobType` | `full_time`, `part_time`, `contract`, `internship`, `remote` |
| `JobStatus` | `open`, `closed` |
| `ApplicationStatus` | `pending`, `reviewed`, `accepted`, `rejected` |

## Relationship Map

```text
Company 1 ---- N User
Company 1 ---- N Job
User    1 ---- N Application
Job     1 ---- N Application
User    1 ---- N SavedJob
Job     1 ---- N SavedJob
```

## Relationship Details

### Company to Users

`User.companyId` is optional. A `company_admin` can be linked to one company.

```prisma
companyId Int?
company   Company? @relation(fields: [companyId], references: [id])
```

The Prisma schema does not set `onDelete: Cascade` for this relation. Treat user unlinking as a workflow that should be verified or handled explicitly before deleting companies in production.

### Company to Jobs

Every job belongs to one company.

```prisma
companyId Int
company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
```

Deleting a company cascades to its jobs.

### User and Job Applications

Applications connect users and jobs.

```prisma
@@unique([userId, jobId])
```

This prevents a user from applying to the same job more than once. Deleting a user or job cascades to related applications.

### User and Saved Jobs

Saved jobs connect users and jobs.

```prisma
@@unique([userId, jobId])
```

This prevents duplicate saved-job records. Deleting a user or job cascades to related saved-job records.

## Important Fields by Model

### User

| Field | Notes |
| --- | --- |
| `email` | Unique and indexed. |
| `password` | Hashed password. |
| `role` | Defaults to `job_seeker`. |
| `companyId` | Optional company link for company admins. |
| `skills` | String array. |
| `refreshToken` | Stores current refresh token for refresh-token rotation. |
| `avatar`, `resume` | Supabase/public file URLs in current services. |

### Company

| Field | Notes |
| --- | --- |
| `email` | Unique company email. |
| `logo`, `coverImage` | Branding assets. |
| `gallery`, `specialties` | String arrays. |
| `mapUrl`, `latitude`, `longitude` | Location/map support. |
| `foundedYear`, `officeCount` | Premium profile fields. |

### Job

| Field | Notes |
| --- | --- |
| `status` | Defaults to `open`; public job listing filters to open jobs. |
| `salaryNegotiable` | Defaults to `false`. |
| `salaryMin`, `salaryMax` | Optional integers. |
| `skills`, `tags` | String arrays. |
| `companyId`, `location`, `jobType`, `status` | Indexed for query performance. |

### Application

| Field | Notes |
| --- | --- |
| `status` | Defaults to `pending`. |
| `coverLetter` | Optional text. |
| `appliedDate` | Defaults to current timestamp. |
| `userId`, `jobId` | Indexed and unique as a pair. |

### Session

Mapped to the `session` table for Express sessions:

```prisma
@@map("session")
```

The `expire` column is indexed as `IDX_session_expire`.

### DeletedAsset

Mapped to the `deleted_assets` table. Used by cleanup workflows to remove files after database references are cleared.

```prisma
filePath  String   @map("file_path")
deletedAt DateTime @default(now()) @map("deleted_at")
```

## Current Data Integrity Notes

- `Application` and `SavedJob` both enforce one record per user/job pair.
- Company deletion cascades to jobs through `Job.company`. Job deletion cascades to applications and saved jobs.
- User deletion cascades to applications and saved jobs.
- Service code should consistently use the literal `super_admin` role instead of `process.env.SERVER`.
- Public responses should be checked for raw numeric IDs and private fields before final release.
