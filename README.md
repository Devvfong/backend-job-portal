# Web-Based Job Finder System

## Overview

The **Web-Based Job Finder System** is a platform that connects **job seekers** with **companies** through a centralized web application.

The system allows job seekers to search and apply for jobs, while HR or company administrators can post job vacancies and manage applications efficiently.

This project focuses on improving recruitment efficiency, reducing manual processes, and providing a structured workflow for both job seekers and employers.

---

# Features

## Job Seeker

Users can:

* Register and login
* Manage profile
* Upload resume
* Search jobs
* Apply filters
* View job details
* Apply to jobs
* Track application status

---

## Company / HR Admin

Administrators can:

* Login to admin dashboard
* Manage company profile
* Create job postings
* Edit job postings
* Delete job postings
* View applicants
* Review resumes
* Update application status

---

# Technology Stack

## Frontend

* React.js
* HTML5
* CSS3
* Tailwind CSS
* DaisyUI
* JavaScript

---

## Backend

* Node.js
* Express.js
* Prisma ORM
* REST API

---

## Database

* PostgreSQL

---

## Development Tools

* Git
* GitHub
* Visual Studio Code
* Vite

---

# System Architecture

The system follows a **layered backend architecture**.

```
Client
  ↓
Express Routes
  ↓
Middleware
  ↓
Controllers
  ↓
Services
  ↓
Prisma ORM
  ↓
PostgreSQL Database
```

This structure ensures the system is:

* scalable
* maintainable
* modular
* easy to extend

---

# Database Design

The database consists of four main entities:

```
User
Company
Job
Application
```

Relationships:

```
Company 1 → N Job
User 1 → N Application
Job 1 → N Application
```

This design ensures proper data organization and efficient query performance.

---

# Project Structure

```
job-finder-system
│
├── docs
│   ├── BACKEND_ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API.md
│
├── prisma
│   └── schema.prisma
│
├── src
│   ├── config
│   ├── controllers
│   ├── services
│   ├── routes
│   ├── middlewares
│   ├── validators
│   ├── utils
│   ├── prisma
│   └── app.js
│
├── uploads
│   └── resumes
│
├── .env.example
├── package.json
└── README.md
```

---

# Installation

### 1. Clone Repository

```
git clone https://github.com/your-username/job-finder-system.git
```

---

### 2. Install Dependencies

```
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file based on:

```
.env.example
```

Example:

```
DATABASE_URL=postgresql://user:password@localhost:5432/jobfinder
JWT_SECRET=supersecretkey
PORT=5000
```

---

### 4. Run Database Migration

```
npx prisma migrate dev
```

---

### 5. Generate Prisma Client

```
npx prisma generate
```

---

### 6. Start Server

```
npm run dev
```

Server will run on:

```
http://localhost:5000
```

---

# API Endpoints

## Authentication

```
POST /api/v1/auth/register
POST /api/v1/auth/login
```

---

## Jobs

```
GET /api/v1/jobs
GET /api/v1/jobs/:id
POST /api/v1/jobs
PUT /api/v1/jobs/:id
DELETE /api/v1/jobs/:id
```

---

## Applications

```
POST /api/v1/jobs/:jobId/apply
GET /api/v1/applications
PATCH /api/v1/applications/:id
```

---

# Security Practices

The system implements several security measures:

* Password hashing using **bcrypt**
* JWT authentication
* Input validation
* Protected routes
* Environment variables for secrets

---

# Future Improvements

Possible future enhancements include:

* Job recommendation system
* Email notifications
* Saved jobs feature
* Admin analytics dashboard
* Advanced job filtering
* Real-time notifications

---

# Conclusion

The Web-Based Job Finder System provides an efficient platform for connecting job seekers with employers.
By automating job search and application management, the system improves recruitment efficiency and provides a scalable solution for modern hiring processes.

---

# License

This project is created for educational purposes.
