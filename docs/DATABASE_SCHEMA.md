# Database Schema Documentation

## Overview

This document describes the database structure of the **Job Finder System**.

The backend uses:

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL

The database contains four core entities:

1. User
2. Company
3. Job
4. Application

---

# Entity Relationship Overview

```
User 1 ------ N Application
Job 1 ------ N Application
Company 1 ------ N Job
```

Meaning:

* A user can apply to multiple jobs
* A job can receive multiple applications
* A company can post multiple jobs

---

# Prisma Schema File

Location:

```
prisma/schema.prisma
```

---

# Enums

## ApplicationStatus

Defines the status of a job application.

```
pending
reviewed
accepted
rejected
```

---

## JobType

Defines job types.

```
full_time
part_time
contract
internship
remote
```

---

## JobStatus

Controls whether a job is visible.

```
open
closed
```

---

# User Model

Represents a job seeker.

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  resume    String?

  applications Application[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}
```

Fields:

| Field    | Description        |
| -------- | ------------------ |
| id       | Primary key        |
| name     | User full name     |
| email    | Unique login email |
| password | Hashed password    |
| resume   | Resume file path   |

---

# Company Model

Represents a company or HR account.

```prisma
model Company {
  id          Int     @id @default(autoincrement())
  companyName String
  email       String  @unique

  jobs Job[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}
```

Fields:

| Field       | Description  |
| ----------- | ------------ |
| id          | Company ID   |
| companyName | Company name |
| email       | HR email     |

---

# Job Model

Represents job postings.

```prisma
model Job {
  id          Int     @id @default(autoincrement())
  title       String
  location    String
  jobType     JobType
  description String?

  salaryMin Int?
  salaryMax Int?

  status JobStatus @default(open)

  companyId Int
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  applications Application[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([companyId])
  @@index([location])
}
```

Fields:

| Field       | Description     |
| ----------- | --------------- |
| id          | Job ID          |
| title       | Job title       |
| location    | Job location    |
| jobType     | Job type        |
| description | Job details     |
| salaryMin   | Minimum salary  |
| salaryMax   | Maximum salary  |
| status      | Job open/closed |

---

# Application Model

Represents job applications.

```prisma
model Application {
  id          Int      @id @default(autoincrement())
  status      ApplicationStatus @default(pending)
  appliedDate DateTime @default(now())

  userId Int
  jobId  Int

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  job  Job  @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@unique([userId, jobId])
  @@index([jobId])
  @@index([userId])
}
```

Fields:

| Field       | Description        |
| ----------- | ------------------ |
| id          | Application ID     |
| status      | Application status |
| appliedDate | Date applied       |
| userId      | Applicant          |
| jobId       | Job applied        |

Constraint:

```
@@unique([userId, jobId])
```

This ensures a **user cannot apply to the same job twice**.

---

# Migration Commands

After modifying the schema run:

```
npx prisma migrate dev --name init
```

Generate Prisma client:

```
npx prisma generate
```

---

# Database Best Practices

Recommended practices:

* hash passwords before storing
* use indexes for search fields
* avoid duplicate applications
* use transactions for complex operations
* validate user input before database queries

---

# Example Database Queries

Get jobs:

```
GET /jobs
```

Apply to job:

```
POST /jobs/:jobId/apply
```

Get applications:

```
GET /applications
```

---

# Future Database Improvements

Possible future extensions:

* saved jobs
* job categories
* notifications
* company profiles
* job recommendations

---

# End of Document
