# API Documentation

## Overview

This document describes the **REST API endpoints** used in the Job Finder System.

The API allows communication between the **frontend application** and the **backend server**.

Base URL example:

```
http://localhost:5000/api/v1
```

---

# Authentication

Authentication uses **JSON Web Tokens (JWT)**.

After login, the server returns a token that must be sent in the request header.

Example header:

```
Authorization: Bearer <token>
```

---

# Auth Endpoints

## Register User

Creates a new job seeker account.

**Endpoint**

```
POST /auth/register
```

**Request Body**

```json
{
  "name": "John Doe",
  "email": "john@email.com",
  "password": "123456"
}
```

**Response**

```json
{
  "success": true,
  "message": "User registered successfully"
}
```

---

## Login User

Authenticates a user and returns a JWT token.

**Endpoint**

```
POST /auth/login
```

**Request Body**

```json
{
  "email": "john@email.com",
  "password": "123456"
}
```

**Response**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@email.com"
  }
}
```

---

# Job Endpoints

## Get All Jobs

Returns a list of available jobs.

**Endpoint**

```
GET /jobs
```

**Query Parameters**

| Parameter | Description        |
| --------- | ------------------ |
| location  | Filter by location |
| jobType   | Filter by job type |

Example:

```
GET /jobs?location=Singapore&jobType=remote
```

**Response**

```json
[
  {
    "id": 1,
    "title": "Frontend Developer",
    "location": "Singapore",
    "jobType": "full_time"
  }
]
```

---

## Get Job By ID

Returns details of a specific job.

**Endpoint**

```
GET /jobs/:id
```

Example:

```
GET /jobs/1
```

---

## Create Job

Allows a company admin to create a job posting.

**Endpoint**

```
POST /jobs
```

**Authorization Required**

**Request Body**

```json
{
  "title": "Backend Developer",
  "location": "Remote",
  "jobType": "full_time",
  "description": "Node.js developer needed"
}
```

---

## Update Job

Updates a job posting.

**Endpoint**

```
PUT /jobs/:id
```

---

## Delete Job

Deletes a job posting.

**Endpoint**

```
DELETE /jobs/:id
```

---

# Application Endpoints

## Apply to Job

Allows a user to apply to a job.

**Endpoint**

```
POST /jobs/:jobId/apply
```

**Authorization Required**

**Response**

```json
{
  "success": true,
  "message": "Application submitted"
}
```

---

## Get User Applications

Returns jobs applied by the logged-in user.

**Endpoint**

```
GET /applications
```

---

## Get Applicants for a Job

Allows HR to view applicants.

**Endpoint**

```
GET /jobs/:jobId/applications
```

---

## Update Application Status

Updates application status.

**Endpoint**

```
PATCH /applications/:id
```

**Request Body**

```json
{
  "status": "reviewed"
}
```

Possible status values:

```
pending
reviewed
accepted
rejected
```

---

# File Upload

Users can upload resumes.

**Endpoint**

```
POST /users/upload-resume
```

Content type:

```
multipart/form-data
```

---

# Error Response Format

All API errors follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

---

# Success Response Format

Standard successful response format:

```json
{
  "success": true,
  "data": {}
}
```

---

# Rate Limiting (Optional)

To prevent abuse, APIs may implement rate limiting.

Example:

```
100 requests per minute
```

---

# Future API Improvements

Possible future API features:

- saved jobs
- job recommendations
- notifications
- company profiles
- advanced job search filters

---

# End of Document
