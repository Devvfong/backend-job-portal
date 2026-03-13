# Backend Architecture Documentation

## Overview

The Job Finder backend is built using a **layered architecture** designed to keep the system:

* scalable
* maintainable
* modular
* easy to test

The backend stack includes:

* **Node.js**
* **Express.js**
* **Prisma ORM**
* **PostgreSQL**
* **JWT Authentication**
* **Multer for file uploads**

---

# Architecture Layers

The request flow follows this structure:

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

Each layer has a specific responsibility.

---

# 1. Routes Layer

Routes define the **API endpoints** for the application.

Responsibilities:

* define HTTP methods
* connect endpoints to controllers
* organize APIs by feature

Example:

```
GET /api/v1/jobs
POST /api/v1/jobs
GET /api/v1/jobs/:id
```

Example route file:

```
src/routes/job.routes.js
```

Example code:

```javascript
import express from "express"
import { getJobs, createJob } from "../controllers/job.controller.js"

const router = express.Router()

router.get("/", getJobs)
router.post("/", createJob)

export default router
```

---

# 2. Middleware Layer

Middleware functions execute **before controllers**.

They handle:

* authentication
* request validation
* error handling
* file uploads

Location:

```
src/middlewares
```

Examples:

```
auth.middleware.js
error.middleware.js
upload.middleware.js
```

Example authentication middleware:

```javascript
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  next()
}
```

---

# 3. Controller Layer

Controllers handle:

* request data
* calling services
* sending responses

Controllers **should not contain business logic**.

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
import * as jobService from "../services/job.service.js"

export const getJobs = async (req, res) => {
  const jobs = await jobService.getJobs()
  res.json(jobs)
}
```

---

# 4. Service Layer

Services contain the **core business logic**.

Examples:

* job search logic
* validation rules
* application processing
* duplicate application checks

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
import prisma from "../prisma/prismaClient.js"

export const getJobs = async () => {
  return prisma.job.findMany()
}
```

---

# 5. Database Layer

The application uses **Prisma ORM** to interact with PostgreSQL.

Location:

```
src/prisma
```

Example file:

```
prismaClient.js
```

Example code:

```javascript
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default prisma
```

---

# Validation Layer

Request validation ensures incoming data is correct.

Recommended libraries:

* **Zod**
* **Joi**

Location:

```
src/validators
```

Example validations:

* email format
* password length
* job title required
* valid job type

Example validator:

```javascript
import { z } from "zod"

export const jobSchema = z.object({
  title: z.string(),
  location: z.string()
})
```

---

# Utility Layer

Reusable helper functions.

Location:

```
src/utils
```

Examples:

```
jwt.js
password.js
apiResponse.js
```

Responsibilities:

* generate JWT tokens
* hash passwords
* standard API responses

Example response helper:

```javascript
export const successResponse = (data) => ({
  success: true,
  data
})
```

---

# File Upload Handling

Resume uploads are handled using **Multer**.

Upload directory:

```
uploads/resumes
```

Example middleware:

```javascript
import multer from "multer"

const upload = multer({ dest: "uploads/resumes" })

export default upload
```

---

# Authentication Strategy

Authentication uses **JWT (JSON Web Tokens)**.

Flow:

```
User Login
 ↓
Generate JWT
 ↓
Client stores token
 ↓
Token sent in Authorization header
```

Example header:

```
Authorization: Bearer TOKEN
```

---

# Error Handling Strategy

The system uses **centralized error handling**.

Example:

```
src/middlewares/error.middleware.js
```

Implementation:

```javascript
export const errorMiddleware = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message
  })
}
```

Registered in Express:

```javascript
app.use(errorMiddleware)
```

---

# Security Best Practices

The backend follows these security practices:

* hash passwords using **bcrypt**
* validate all input
* protect private routes
* limit file upload size
* store secrets in environment variables

Example `.env`:

```
DATABASE_URL=
JWT_SECRET=
PORT=
```

---

# Scalability Considerations

Future improvements may include:

* Redis caching
* email notifications
* background jobs
* job recommendation system
* search indexing

---

# Project Folder Structure

A recommended project structure:

```
src
│
├── config
│   ├── env.js
│   └── database.js
│
├── controllers
│   ├── auth.controller.js
│   ├── job.controller.js
│   └── application.controller.js
│
├── services
│   ├── auth.service.js
│   ├── job.service.js
│   └── application.service.js
│
├── routes
│   ├── auth.routes.js
│   ├── job.routes.js
│   └── application.routes.js
│
├── middlewares
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── upload.middleware.js
│
├── validators
│   ├── auth.validator.js
│   └── job.validator.js
│
├── prisma
│   └── prismaClient.js
│
├── utils
│   ├── jwt.js
│   ├── password.js
│   └── apiResponse.js
│
└── app.js
```

---

# Final Backend Flow

```
Client Request
     ↓
Express Router
     ↓
Middleware
     ↓
Controller
     ↓
Service
     ↓
Prisma ORM
     ↓
PostgreSQL
```

This structure ensures the system remains:

* maintainable
* scalable
* easy to extend
* production ready

---

# End of Document
