# Database Schema Documentation

## Overview

This document describes the **database structure** of the Job Finder System.

The backend uses:

* Node.js
* Express.js
* Prisma ORM
* PostgreSQL (NeonDB)

The database contains **four core entities**:

1. User
2. Company
3. Job
4. Application

---

# Entity Relationship Overview

Relationships:

```
User 1 --- N Application
Job 1 --- N Application
Company 1 --- N Job
```

Meaning:

* A **user can apply to many jobs**
* A **job can receive many applications**
* A **company can post many jobs**

---

# Prisma Schema

File location:

```
prisma/schema.prisma
```

---

## User Model

Represents a **job seeker**.

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  resume    String?

  applications Application[]

  createdAt DateTime @default(now())
}
```

### Fields

| Field    | Type   | Description      |
| -------- | ------ | ---------------- |
| id       | Int    | Primary key      |
| name     | String | User name        |
| email    | String | Unique email     |
| password | String | Hashed password  |
| resume   | String | Resume file path |

---

## Company Model

Represents a **company or HR account**.

```prisma
model Company {
  id          Int    @id @default(autoincrement())
  companyName String
  email       String

  jobs        Job[]

  createdAt DateTime @default(now())
}
```

### Fields

| Field       | Type   | Description  |
| ----------- | ------ | ------------ |
| id          | Int    | Company ID   |
| companyName | String | Company name |
| email       | String | HR email     |

---

## Job Model

Represents a **job posting**.

```prisma
model Job {
  id        Int    @id @default(autoincrement())
  title     String
  location  String
  jobType   String
  description String?

  companyId Int
  company   Company @relation(fields: [companyId], references: [id])

  applications Application[]

  createdAt DateTime @default(now())
}
```

### Fields

| Field     | Type   | Description           |
| --------- | ------ | --------------------- |
| id        | Int    | Job ID                |
| title     | String | Job title             |
| location  | String | Job location          |
| jobType   | String | Full-time / Part-time |
| companyId | Int    | Company relation      |

---

## Application Model

Represents a **job application**.

```prisma
model Application {
  id          Int      @id @default(autoincrement())
  status      String   @default("pending")
  appliedDate DateTime @default(now())

  userId Int
  jobId  Int

  user User @relation(fields: [userId], references: [id])
  job  Job  @relation(fields: [jobId], references: [id])
}
```

### Fields

| Field       | Type     | Description        |
| ----------- | -------- | ------------------ |
| id          | Int      | Application ID     |
| status      | String   | Application status |
| appliedDate | DateTime | Application date   |
| userId      | Int      | Applicant          |
| jobId       | Int      | Job applied        |

---

# Application Status Values

Possible values:

```
pending
reviewed
accepted
rejected
```

---

# Migration Commands

After modifying the schema run:

```
npx prisma migrate dev --name update_schema
```

To generate Prisma client:

```
npx prisma generate
```

---

# Database Best Practices

Recommended practices:

* Always hash passwords
* Use indexes for search fields
* Validate user input
* Use transactions for complex operations
* Avoid duplicate applications

Example rule:

A user **cannot apply to the same job twice**.

---
