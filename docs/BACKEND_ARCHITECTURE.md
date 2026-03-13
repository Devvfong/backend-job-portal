# Backend Architecture

## Overview

The Job Finder System backend follows a **layered architecture** to keep the code:

* maintainable
* scalable
* modular

Architecture layers:

```
Route
 ↓
Controller
 ↓
Service
 ↓
Prisma ORM
 ↓
Database
```

---

# Architecture Layers

## 1 Routes Layer

Routes define **API endpoints**.

Example:

```
GET /api/v1/jobs
POST /api/v1/jobs
```

Location:

```
src/routes
```

Example file:

```
job.routes.js
```

Example code:

```javascript
router.get("/", getJobs)
router.post("/", createJob)
```

---

# 2 Controller Layer

Controllers handle:

* request validation
* response formatting
* calling services

Location:

```
src/controllers
```

Example:

```
job.controller.js
```

Example code:

```javascript
export const getJobs = async (req, res) => {
  const jobs = await jobService.getJobs()
  res.json(jobs)
}
```

---

# 3 Service Layer

Services contain **business logic**.

Examples:

* job search logic
* application validation
* duplicate application check

Location:

```
src/services
```

Example:

```
job.service.js
```

Example code:

```javascript
export const getJobs = async () => {
  return prisma.job.findMany()
}
```

---

# 4 Database Layer

Uses Prisma ORM to interact with PostgreSQL.

Location:

```
src/prisma/prismaClient.js
```

Example:

```javascript
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default prisma
```

---

# Middleware Layer

Middlewares run **before controllers**.

Examples:

* authentication
* error handling
* file upload

Location:

```
src/middlewares
```

Example middleware:

```
auth.middleware.js
```

Responsibilities:

* verify JWT
* attach user to request

---

# Utility Layer

Reusable helper functions.

Location:

```
src/utils
```

Examples:

* JWT generation
* password hashing
* API responses

---

# Request Flow Example

Example: user applies for a job.

```
POST /jobs/:jobId/applications
```

Flow:

```
Route
 ↓
Auth Middleware
 ↓
Application Controller
 ↓
Application Service
 ↓
Prisma
 ↓
Database
```

---

# Error Handling Strategy

Use a global error middleware.

Example:

```javascript
app.use(errorMiddleware)
```

Benefits:

* centralized error handling
* consistent API responses

---

# Validation Strategy

Input validation should be added before controllers.

Recommended tools:

* Zod
* Joi

Example validation:

```
email format
password length
job title required
```

---

# File Upload Handling

Resume uploads handled using:

```
multer
```

Upload path:

```
uploads/resumes
```

Controller saves the file path in the database.

---

# Security Best Practices

Important security measures:

* hash passwords using bcrypt
* store JWT secrets in environment variables
* validate user input
* protect admin routes
* limit file upload size

---

# Scalability Considerations

For future improvements:

* caching (Redis)
* background jobs
* email notifications
* job recommendation system

---

# Final Backend Flow

```
Client Request
     ↓
Express Route
     ↓
Middleware
     ↓
Controller
     ↓
Service
     ↓
Prisma ORM
     ↓
PostgreSQL Database
```

---

# End of Document
