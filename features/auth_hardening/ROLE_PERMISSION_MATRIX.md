# Role & Permission Matrix

This project has three roles:

- `job_seeker`
- `company_admin`
- `super_admin`

## Job Seeker

Allowed:

- Register through public registration.
- Log in and manage their own profile.
- View public jobs and companies.
- Apply to open jobs.
- Withdraw their own applications.
- Save and unsave jobs.
- View their own applications and saved jobs.

Not allowed:

- Create, edit, or delete jobs.
- View applicants for company jobs.
- Change application status.
- Manage companies or users.

## Company Admin

Allowed:

- Log in and manage their own company profile.
- Create a company only when not already linked to one.
- Create jobs for their own company.
- Edit and delete jobs belonging to their own company.
- View applicants for their own company jobs.
- Update statuses for applications to their own company jobs.
- Upload company logo, cover, and gallery assets.
- View company dashboard stats.

Not allowed:

- Apply to jobs as a job seeker.
- Save jobs as a job seeker.
- Manage another company's jobs or applicants.
- Change their own company identity fields such as name/email without super admin approval.
- Manage platform users.

## Super Admin

Allowed:

- Manage users.
- Manage companies.
- Change user roles and company assignments.
- Access admin dashboard.
- Bypass route-level role restrictions through `authorize.middleware.js`.

Important caveat:

Even when route-level role checks allow `super_admin`, service-level ownership checks may still need explicit super-admin support. Check services before assuming super admin can perform every mutation.

## Ownership Rules

- A company admin can only manage records tied to their `companyId`.
- A job seeker can only withdraw their own applications.
- Applications are unique by `userId + jobId`.
- Saved jobs are unique by `userId + jobId`.
- Closed jobs should not accept new applications.

## Route Protection Pattern

1. Use `protect` for authenticated routes.
2. Use `authorize(...)` for role-gated routes.
3. Use service-level checks for ownership.
4. Never trust frontend role checks alone.
