# API Contract Notes

The frontend and backend use a mixed camelCase/snake_case contract. Be careful when adding or changing fields.

## Frontend API Wrapper

Frontend app code usually imports from `lib/api.ts`:

- `get`
- `post`
- `put`
- `del`

These helpers return unwrapped response data directly.

Example:

```ts
const jobs = await get<Job[]>('/jobs')
```

The wrapper also normalizes response keys by adding both camelCase and snake_case aliases.

Example:

- `job.jobType`
- `job.job_type`

Both can work at runtime, but new frontend code should prefer camelCase.

## Raw API Object

Some older dashboard code imports `api` from `lib/api.ts`.

This returns the raw Axios response, so code must read `.data`.

Example:

```ts
const res = await api.post('/auth/login', payload)
const data = res.data
```

Do not mix the two patterns inside one flow unless there is a clear reason.

## Backend Envelope

Most backend responses use:

```json
{
  "status": "success",
  "data": {}
}
```

The frontend helper unwraps this and returns the inner `data`.

## Important Contract Areas

Jobs:

- `id`
- `encryptedId`
- `title`
- `description`
- `requirements`
- `jobType`
- `salaryMin`
- `salaryMax`
- `salaryNegotiable`
- `company`
- `createdAt`

Companies:

- `id` may be encrypted in public responses.
- `encryptedId` should be preferred for public links.
- Public company detail should not expose sensitive users/email unless intentionally allowed.

Applications:

- `appliedDate` is the main timestamp.
- `status` should be one of `pending`, `reviewed`, `accepted`, `rejected`.
- Company-side application payloads include applicant user data.

Notifications:

- Frontend supports both `createdAt` and `time`.
- Backend should send `createdAt` for compatibility.

## Validation Behavior

Backend validation uses Zod and replaces `req.body` with parsed data.

Unsupported fields are stripped.

Frontend forms must send fields that route schemas allow, not every database column.
