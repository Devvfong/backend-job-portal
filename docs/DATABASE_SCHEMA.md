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

Additional constraint:

```
User 1 --- 1 Application per Job
```

A user **cannot apply to the same job more than once**.

---

# Prisma Schema

File location:

```
prisma/schema.prisma
```

---

# Enums

Enums ensure **data consistency and validation**.

## ApplicationStatus

```prisma
enum ApplicationStatus {
  pending
  reviewed
  accepted
  rejected
}
```

## JobType

```prisma
enum JobType {
  full_time
  part_time
  contract
  internship
  remote
}
```

---

# User Model

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
  updatedAt DateTime @updatedAt
}
```

### Fields

| Field     | Type     | Description          |
| --------- | -------- | -------------------- |
| id        | Int      | Primary key          |
| name      | String   | User name            |
| email     | String   | Unique email         |
| password  | String   | Hashed password      |
| resume    | String?  | Resume file path     |
| createdAt | DateTime | Record creation time |
| updatedAt | DateTime | Last update time     |

---

# Company Model

Represents a **company or HR account**.

```prisma
model Company {
  id          Int     @id @default(autoincrement())
  companyName String
  email       String  @unique

  jobs Job[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Fields

| Field       | Type     | Description          |
| ----------- | -------- | -------------------- |
| id          | Int      | Company ID           |
| companyName | String   | Company name         |
| email       | String   | HR email             |
| createdAt   | DateTime | Record creation time |
| updatedAt   | DateTime | Last update time     |

---

# Job Model

Represents a **job posting**.

```prisma
model Job {
  id          Int     @id @default(autoincrement())
  title       String
  location    String
  jobType     JobType
  description String?

  companyId Int
  company   Company @relation(fields: [companyId], references: [id])

  applications Application[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([companyId])
}
```

### Fields

| Field       | Type     | Description          |
| ----------- | -------- | -------------------- |
| id          | Int      | Job ID               |
| title       | String   | Job title            |
| location    | String   | Job location         |
| jobType     | JobType  | Job category         |
| description | String?  | Job description      |
| companyId   | Int      | Company reference    |
| createdAt   | DateTime | Record creation time |
| updatedAt   | DateTime | Last update time     |

---

# Application Model

Represents a **job application**.

```prisma
model Application {
  id          Int      @id @default(autoincrement())
  status      ApplicationStatus @default(pending)
  appliedDate DateTime @default(now())

  userId Int
  jobId  Int

  user User @relation(fields: [userId], references: [id])
  job  Job  @relation(fields: [jobId], references: [id])

  @@unique([userId, jobId])
  @@index([jobId])
}
```

### Fields

| Field       | Type              | Description         |
| ----------- | ----------------- | ------------------- |
| id          | Int               | Application ID      |
| status      | ApplicationStatus | Application state   |
| appliedDate | DateTime          | Date of application |
| userId      | Int               | Applicant           |
| jobId       | Int               | Job applied         |

---

# Application Status Values

Possible values:

```
pending
reviewed
accepted
rejected
```

These values are enforced using the **ApplicationStatus enum**.

---

# Database Constraints

Important rules enforced by the schema:

### Unique Email

```
User.email is unique
Company.email is unique
```

### Single Application per Job

```
@@unique([userId, jobId])
```

This ensures:

```
One user cannot apply to the same job multiple times.
```

---

# Migration Commands

After modifying the schema run:

```
npx prisma migrate dev --name update_schema
```

Generate Prisma client:

```
npx prisma generate
```

Reset database (development only):

```
npx prisma migrate reset
```

---

# Database Best Practices

Recommended practices:

* Always hash passwords using bcrypt
* Use enums instead of free text for status fields
* Add indexes to frequently queried fields
* Validate user input before saving
* Use transactions for complex operations
* Prevent duplicate records with unique constraints

---

# Future Schema Improvements

Possible future enhancements:

* Job categories
* Job salary range
* User profile details (skills, experience)
* Company logo upload
* Bookmark / save job feature

---

# End of Document
