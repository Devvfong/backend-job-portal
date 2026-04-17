# Job Platform API

A REST API for a job platform where users can create profiles, upload resumes, apply for jobs, and recruiters can manage companies and job postings.

---

## Base URL

```
/api/v1
```

All endpoints return JSON responses.

Authentication uses **JWT tokens**.

Protected endpoints require:

```
Authorization: Bearer <token>
```

---

## Standard API Response Format

### Success

```json
{
  "status": "success",
  "data": {}
}
```

### Error

```json
{
  "status": "fail",
  "message": "Error description"
}
```

---

## HTTP Status Codes

| Code | Meaning          |
| ---- | ---------------- |
| 200  | Success          |
| 201  | Created          |
| 400  | Validation Error |
| 401  | Unauthorized     |
| 403  | Forbidden        |
| 404  | Not Found        |
| 500  | Server Error     |

---

# Authentication

## Register User

**POST** `/auth/register`

### Request

```json
{
  "name": "John Doe",
  "email": "john@email.com",
  "password": "123456"
}
```

### Response

```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@email.com"
    },
    "token": "jwt_token"
  }
}
```

---

## Login

**POST** `/auth/login`

### Request

```json
{
  "email": "john@email.com",
  "password": "123456"
}
```

### Response

```json
{
  "status": "success",
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe"
    },
    "token": "jwt_token"
  }
}
```

---

## Logout

**POST** `/auth/logout`

---

## Get Current User

**GET** `/auth/me`

```
Authorization: Bearer <JWT>
```

---

# User Profile

## Create Profile

**POST** `/users/profile`

Creates a new profile for the authenticated user.

```json
{
  "headline": "Fullstack Developer",
  "bio": "Passionate about web tech",
  "location": "Remote",
  "phone": "+1234567890",
  "skills": ["JavaScript", "React"]
}
```

---

## Get Profile

**GET** `/users/profile`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@email.com",
    "headline": "Backend Developer",
    "bio": "Backend developer with 5 years experience",
    "location": "Singapore",
    "phone": "+65 12345678",
    "skills": ["Node.js", "PostgreSQL"],
    "avatar": "/uploads/avatar.jpg",
    "resumeUrl": "/uploads/resume.pdf"
  }
}
```

---

## Get User Stats

**GET** `/users/me/stats`

Returns a summary of the user's activity and profile completeness.

Response:
```json
{
  "status": "success",
  "data": {
    "totalApplications": 12,
    "totalSavedJobs": 5,
    "profileStrength": 85
  }
}
```

---

## Update Profile

**PUT** `/users/profile`

```json
{
  "headline": "Backend Developer",
  "bio": "5 years experience",
  "location": "Singapore",
  "skills": ["Node.js", "PostgreSQL"]
}
```

---

## Update User By ID (Admin)

**PUT** `/users/profile/:id`

Special endpoint for `super_admin` to update any user's profile, role, or company link.

---

## Get All Users (Admin)

**GET** `/users`

Returns a paginated list of all users. Restricted to `super_admin`.

---

## Delete User (Admin)

**DELETE** `/users/:id`

Restricted to `super_admin`.

---

## Upload Avatar

**POST** `/users/avatar`

```
multipart/form-data
```

---

## Upload Resume

**POST** `/users/resume`

```
multipart/form-data
```

---

# Companies

## Create Company

**POST** `/companies/create`

```json
{
  "companyName": "Tech Corp",
  "description": "AI startup",
  "website": "https://techcorp.com",
  "location": "Singapore",
  "industry": "Software",
  "size": "50-100",
  "email": "hr@techcorp.com"
}
```

---

## Get Company

**GET** `/companies/:id`

---

## Update Company

**PUT** `/companies/:id`

---

## Delete Company

**DELETE** `/companies/:id`

Restricted to `super_admin` or the company owner.

---

## Upload Logo

**POST** `/companies/logo`

```
multipart/form-data (field: logo)
```

Restricted to `company_admin`. Updates the company associated with the current user.

---

## Delete Logo

**DELETE** `/companies/logo`

Removes the logo for the company associated with the current user.

---

## Get Company Stats

**GET** `/companies/me/stats`

Returns a summary of job postings and applications for the recruiter's company.

Response:
```json
{
  "status": "success",
  "data": {
    "totalJobs": 5,
    "totalApplications": 24,
    "statusSummary": {
      "pending": 10,
      "reviewed": 8,
      "accepted": 4,
      "rejected": 2
    }
  }
}
```

---

# Jobs

## Get Jobs

**GET** `/jobs`

Query:

- search
- location
- jobType
- page
- limit

---

## Get Job Details

**GET** `/jobs/:id`

---

## Create Job

**POST** `/jobs/create`

```json
{
  "title": "Backend Developer",
  "description": "Work with Node.js and PostgreSQL",
  "location": "Remote",
  "jobType": "full_time",
  "requirements": "Strong SQL skills",
  "benefits": "Health insurance, remote work",
  "salaryMin": 5000,
  "salaryMax": 8000
}
```

---

## Update Job

**PUT** `/jobs/:id`

---

## Delete Job

**DELETE** `/jobs/:id`

---

## Save Job

**POST** `/jobs/:id/save`

---

## Get Saved Jobs

**GET** `/jobs/saved`

---

# Applications

## Apply to Job

**POST** `/applications/job/:id/apply`

Job Seeker endpoint to apply for a specific job.

---

## Get My Applications

**GET** `/applications/me`

---

## Get Applicants

**GET** `/applications/job/:id/applicants`

Restricted to `company_admin`.

---

## Update Application Status

**PATCH** `/applications/:id/status`

```json
{
  "status": "reviewed"
}
```

---

## Withdraw Application

**DELETE** `/applications/:id`

Allows a job seeker to withdraw their application.

---

# Endpoint Summary

```
AUTH
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me

USERS
GET    /users/profile
GET    /users/me/stats
POST   /users/profile
PUT    /users/profile
PUT    /users/profile/:id           (Admin)
GET    /users                       (Admin)
DELETE /users/:id                   (Admin)
POST   /users/avatar
POST   /users/resume

COMPANIES
POST   /companies/create
GET    /companies
GET    /companies/:id
PUT    /companies/:id
POST   /companies/logo
DELETE /companies/logo

JOBS
GET    /jobs
GET    /jobs/saved                  (Job Seeker)
GET    /jobs/:id
POST   /jobs/create                 (Recruiter)
PUT    /jobs/:id                    (Recruiter)
DELETE /jobs/:id                    (Recruiter)
POST   /jobs/:id/save               (Job Seeker)

APPLICATIONS
POST   /applications/job/:id/apply  (Job Seeker)
GET    /applications/me             (Job Seeker)
DELETE /applications/:id            (Job Seeker - Withdraw)
GET    /applications/job/:id/applicants (Recruiter)
PATCH  /applications/:id/status     (Recruiter)

COMPANIES (Cont.)
GET    /companies/me/stats          (Recruiter)
```
