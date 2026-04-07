const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Job Portal Backend API",
    version: "1.0.0",
    description: "API documentation for the Web-Based Job Finder System. Includes endpoints for Job Seekers and Company Admins.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development",
    },
  ],
  tags: [
    { name: "System", description: "Health and documentation" },
    { name: "Auth", description: "Authentication and Authorization" },
    { name: "Jobs", description: "Job postings management" },
    { name: "Users", description: "User profile and resume management" },
    { name: "Companies", description: "Company profiles and logo management" },
    { name: "Applications", description: "Job application submissions and status tracking" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "jwt",
      },
    },
    schemas: {
      SuccessMessage: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          message: { type: "string", example: "Operation completed successfully" },
        },
      },
      ErrorMessage: {
        type: "object",
        properties: {
          status: { type: "string", example: "fail" },
          message: { type: "string", example: "Error description" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          role: { type: "string", enum: ["job_seeker", "company_admin"], example: "job_seeker" },
        },
      },
      Company: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          companyName: { type: "string", example: "Tech Innovators Inc." },
          description: { type: "string", example: "A leading tech company." },
          location: { type: "string", example: "New York, NY" },
          website: { type: "string", example: "https://techinnovators.com" },
          industry: { type: "string", example: "Software" },
          size: { type: "string", example: "50-200" },
          logo: { type: "string", example: "https://storage.example.com/logo.png" },
          email: { type: "string", example: "contact@techinnovators.com" },
        },
      },
      Job: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Backend Engineer" },
          location: { type: "string", example: "Remote" },
          jobType: { type: "string", enum: ["full_time", "part_time", "contract", "internship", "remote"], example: "full_time" },
          description: { type: "string", example: "Develop APIs using Node.js" },
          requirements: { type: "string", example: "3+ years of experience with Express and Prisma" },
          benefits: { type: "string", example: "Health insurance, 401k" },
          salaryMin: { type: "integer", example: 80000 },
          salaryMax: { type: "integer", example: 120000 },
          status: { type: "string", enum: ["open", "closed"], example: "open" },
          companyId: { type: "integer", example: 1 },
        },
      },
      Application: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          status: { type: "string", enum: ["pending", "reviewing", "shortlisted", "rejected", "accepted"], example: "pending" },
          userId: { type: "integer", example: 1 },
          jobId: { type: "integer", example: 1 },
          resumeId: { type: "integer", example: 1 },
          appliedAt: { type: "string", format: "date-time", example: "2023-10-01T12:00:00Z" }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Ly" },
          email: { type: "string", format: "email", example: "ly@example.com" },
          password: { type: "string", minLength: 6, example: "123456" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "ly@example.com" },
          password: { type: "string", example: "123456" },
        },
      },
      CreateJobRequest: {
        type: "object",
        required: ["title", "description", "location", "jobType", "requirements", "benefits", "salaryMin", "salaryMax"],
        properties: {
          title: { type: "string", example: "Backend Engineer" },
          description: { type: "string", example: "Node.js + Prisma + PostgreSQL" },
          location: { type: "string", example: "Phnom Penh" },
          jobType: { type: "string", enum: ["full_time", "part_time", "contract", "internship", "remote"], example: "full_time" },
          requirements: { type: "string", example: "Node.js, Express, Postgres" },
          benefits: { type: "string", example: "13th month salary" },
          salaryMin: { type: "integer", example: 400 },
          salaryMax: { type: "integer", example: 1200 },
          companyId: { type: "integer", nullable: true, example: 1 }
        },
      },
      ProfileRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "Ly" },
          email: { type: "string", format: "email", example: "ly@example.com" },
          headline: { type: "string", example: "Backend Developer" },
          bio: { type: "string", example: "I build APIs" },
          location: { type: "string", example: "Cambodia" },
          phone: { type: "string", example: "+85512345678" },
          avatar: { type: "string", example: "https://example.com/avatar.jpg" },
          skills: { type: "array", items: { type: "string" }, example: ["Node.js", "Express"] },
          resume: { type: "string", example: "https://example.com/resume.pdf" }
        }
      },
      CreateCompanyRequest: {
        type: "object",
        required: ["companyName", "description", "location", "industry", "size", "email"],
        properties: {
          companyName: { type: "string", example: "Tech Corp" },
          description: { type: "string", example: "Software Development Company" },
          location: { type: "string", example: "Singapore" },
          website: { type: "string", example: "https://techcorp.com" },
          industry: { type: "string", example: "Software" },
          size: { type: "string", example: "10-50" },
          logo: { type: "string", example: "https://techcorp.com/logo.png" },
          email: { type: "string", format: "email", example: "contact@techcorp.com" }
        }
      }
    },
  },
  paths: {
    // -------------------------------- SYSTEM --------------------------------
    "/": {
      get: {
        tags: ["System"],
        summary: "API Health & Landing Page",
        responses: {
          200: {
            description: "HTML Landing Page",
          },
        },
      },
    },

    // -------------------------------- AUTH --------------------------------
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "Validation error or user already exists" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and receive JWT cookie",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          200: { description: "Login successful" },
          400: { description: "Invalid credentials" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout current user",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Logged out successfully" },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user info",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "User details returned" },
          401: { description: "Not authorized" },
        },
      },
    },
    "/api/v1/auth": {
      get: {
        tags: ["Auth"],
        summary: "Test protected admin route",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Authenticated" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires company_admin role" },
        },
      },
    },

    // -------------------------------- JOBS --------------------------------
    "/api/v1/jobs": {
      get: {
        tags: ["Jobs"],
        summary: "Get all jobs with pagination & filtering",
        responses: {
          200: { description: "List of jobs returned" },
        },
      },
    },
    "/api/v1/jobs/{id}": {
      get: {
        tags: ["Jobs"],
        summary: "Get specific job by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Job details returned" },
          404: { description: "Job not found" },
        },
      },
      put: {
        tags: ["Jobs"],
        summary: "Update job listing",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CreateJobRequest" } } } },
        responses: { 200: { description: "Job updated" } },
      },
      delete: {
        tags: ["Jobs"],
        summary: "Delete job listing",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Job deleted" } },
      },
    },
    "/api/v1/jobs/create": {
      post: {
        tags: ["Jobs"],
        summary: "Create a new job posting",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateJobRequest" } } },
        },
        responses: { 201: { description: "Job created" } },
      },
    },

    // -------------------------------- USERS (PROFILES) --------------------------------
    "/api/v1/users/profile": {
      get: {
        tags: ["Users"],
        summary: "Get current user profile",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: "Profile returned" } },
      },
      post: {
        tags: ["Users"],
        summary: "Initialize user profile",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileRequest" } } } },
        responses: { 201: { description: "Profile created" } },
      },
      put: {
        tags: ["Users"],
        summary: "Update user profile",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileRequest" } } } },
        responses: { 200: { description: "Profile updated" } },
      },
    },
    "/api/v1/users/avatar": {
      post: {
        tags: ["Users"],
        summary: "Upload user avatar image",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", properties: { avatar: { type: "string", format: "binary" } } } } },
        },
        responses: { 200: { description: "Avatar uploaded" } },
      },
    },
    "/api/v1/users/resume": {
      post: {
        tags: ["Users"],
        summary: "Upload user resume file",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", properties: { resume: { type: "string", format: "binary" } } } } },
        },
        responses: { 200: { description: "Resume uploaded" } },
      },
    },

    // -------------------------------- COMPANIES --------------------------------
    "/api/v1/companies": {
      get: {
        tags: ["Companies"],
        summary: "Get all companies",
        responses: { 200: { description: "List of companies returned" } },
      },
    },
    "/api/v1/companies/create": {
      post: {
        tags: ["Companies"],
        summary: "Create a new company profile",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCompanyRequest" } } } },
        responses: { 201: { description: "Company created" } },
      },
    },
    "/api/v1/companies/{id}": {
      get: {
        tags: ["Companies"],
        summary: "Get specific company by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Company details returned" } },
      },
      put: {
        tags: ["Companies"],
        summary: "Update company profile",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCompanyRequest" } } } },
        responses: { 200: { description: "Company updated" } },
      },
      delete: {
        tags: ["Companies"],
        summary: "Delete company profile",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Company deleted" } },
      },
    },
    "/api/v1/companies/logo": {
      post: {
        tags: ["Companies"],
        summary: "Upload company logo",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", properties: { logo: { type: "string", format: "binary" } } } } },
        },
        responses: { 200: { description: "Logo uploaded" } },
      },
      delete: {
        tags: ["Companies"],
        summary: "Delete company logo",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: "Logo deleted" } },
      },
    },

    // -------------------------------- APPLICATIONS --------------------------------
    "/api/v1/applications/job/{id}/apply": {
      post: {
        tags: ["Applications"],
        summary: "Apply to a job (Job Seeker)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Job ID" }],
        responses: { 201: { description: "Application submitted successfully" } },
      },
    },
    "/api/v1/applications/me": {
      get: {
        tags: ["Applications"],
        summary: "Get jobs applied by the current user (Job Seeker)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: "List of applied jobs" } },
      },
    },
    "/api/v1/applications/job/{id}/applicants": {
      get: {
        tags: ["Applications"],
        summary: "View all applicants for a specific job (Recruiter)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Job ID" }],
        responses: { 200: { description: "List of applicants" } },
      },
    },
    "/api/v1/applications/{id}/status": {
      patch: {
        tags: ["Applications"],
        summary: "Update application status (Recruiter)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Application ID" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["pending", "reviewing", "shortlisted", "rejected", "accepted"] } } } } },
        },
        responses: { 200: { description: "Application status updated" } },
      },
    },
  },
};

export default openApiDocument;
