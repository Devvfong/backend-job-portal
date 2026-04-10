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
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
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
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@email.com"
    }
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
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "name": "John Doe"
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

**POST** `/companies`

```json
{
  "name": "Tech Corp",
  "description": "AI startup",
  "website": "https://techcorp.com",
  "location": "Singapore"
}
```

---

## Get Company

**GET** `/companies/:id`

---

## Update Company

**PUT** `/companies/:id`

---

## Upload Logo

**POST** `/companies/:id/logo`

```
multipart/form-data
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

**POST** `/jobs`

```json
{
  "title": "Backend Developer",
  "location": "Remote",
  "jobType": "full_time"
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

**POST** `/jobs/:id/applications`

```json
{
  "coverLetter": "I am interested in this role"
}
```

---

## Get My Applications

**GET** `/applications/me`

---

## Withdraw Application

**DELETE** `/applications/:id`

Allows a job seeker to withdraw their application.

---

## Get Applicants

**GET** `/jobs/:id/applications`

---

## Update Application

**PATCH** `/applications/:id`

```json
{
  "status": "reviewed"
}
```

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
PUT    /users/profile
PUT    /users/profile/:id     (Admin)
GET    /users                 (Admin)
DELETE /users/:id             (Admin)
POST   /users/avatar
POST   /users/resume

COMPANIES
POST   /companies
GET    /companies/:id
PUT    /companies/:id
POST   /companies/:id/logo
GET    /companies/me/stats    (Recruiter)

JOBS
GET    /jobs
GET    /jobs/:id
POST   /jobs
PUT    /jobs/:id
DELETE /jobs/:id
POST   /jobs/:id/save         (Job Seeker)
GET    /jobs/saved            (Job Seeker)

APPLICATIONS
POST   /jobs/:id/apply
GET    /applications/me
GET    /jobs/:id/applicants
PATCH  /applications/:id
DELETE /applications/:id      (Withdraw)
```
