# Job Platform API (Final)

## Base URL

```
/api/v1
```

All endpoints return JSON responses.

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

Status: **201 Created**

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

Status: **200 OK**

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

Invalidates the current user session.

---

## Get Current User

**GET** `/auth/me`

Requires authentication.

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@email.com"
  }
}
```

---

# Jobs

## Get Jobs

**GET** `/jobs`

### Query Parameters

| Parameter | Description                    |
| --------- | ------------------------------ |
| search    | Search job title               |
| location  | Filter by location             |
| jobType   | full_time, part_time, contract |
| minSalary | Minimum salary                 |
| maxSalary | Maximum salary                 |
| page      | Page number                    |
| limit     | Items per page                 |
| sort      | createdAt, salaryMin           |
| order     | asc, desc                      |

### Example

```
GET /jobs?location=Singapore&jobType=remote&page=1&limit=10
```

### Response

```json
{
  "success": true,
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 120,
      "pages": 12
    }
  }
}
```

---

## Get Job Details

**GET** `/jobs/:id`

### Response

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Backend Developer",
    "location": "Remote",
    "salaryMin": 5000,
    "salaryMax": 8000
  }
}
```

---

## Create Job

**POST** `/jobs`

### Request

```json
{
  "title": "Backend Developer",
  "location": "Remote",
  "jobType": "full_time",
  "description": "Node developer",
  "salaryMin": 5000,
  "salaryMax": 8000
}
```

Status: **201 Created**

---

## Update Job

**PUT** `/jobs/:id`

Updates an existing job post.

---

## Delete Job

**DELETE** `/jobs/:id`

Deletes a job posting.

---

# Applications

## Apply to Job

**POST** `/jobs/:id/applications`

### Response

```json
{
  "success": true,
  "message": "Application submitted"
}
```

Users cannot apply to the same job twice.

---

## Get My Applications

**GET** `/applications/me`

Returns jobs the logged-in user applied to.

---

## Get Applicants for Job

**GET** `/jobs/:id/applications`

Used by company/HR to view applicants.

---

## Update Application Status

**PATCH** `/applications/:id`

### Request

```json
{
  "status": "reviewed"
}
```

### Allowed Status Values

* pending
* reviewed
* accepted
* rejected

---

# Resume Upload

**POST** `/users/resume`

Content-Type

```
multipart/form-data
```

Uploads a user resume file.

---

# Standard API Response Format

## Success

```json
{
  "success": true,
  "data": {}
}
```

## Error

```json
{
  "success": false,
  "message": "Error description"
}
```

---

# HTTP Status Codes

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

# Endpoint Summary

```
AUTH
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me

JOBS
GET    /jobs
GET    /jobs/:id
POST   /jobs
PUT    /jobs/:id
DELETE /jobs/:id

APPLICATIONS
POST   /jobs/:id/applications
GET    /applications/me
GET    /jobs/:id/applications
PATCH  /applications/:id

FILES
POST   /users/resume
```
