const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "NextHire Backend API",
    version: "1.0.0",
    description: "API documentation for the Web-Based Job Finder System. Includes endpoints for Job Seekers and Company Admins.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development",
    },
  ],
  tags: [
    { name: "System", description: "Health and documentation" },
    { name: "Auth", description: "Authentication and Authorization" },
    { name: "Jobs", description: "Job postings management" },
    { name: "Users", description: "User profile and resume management" },
    { name: "Companies", description: "Company profiles and logo management" },
    { name: "Applications", description: "Job application submissions and status tracking" },
    { name: "OAuth", description: "Third-party OAuth flows" },
    { name: "Lookup", description: "Public lookup data such as categories and locations" },
    { name: "Dashboard", description: "Global dashboard metrics" },
    { name: "Notifications", description: "Authenticated notification feed" },
    { name: "Admin", description: "Super admin management endpoints" }
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
      ApiResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          message: { type: "string", nullable: true, example: "OK" },
          data: { type: "object", nullable: true, additionalProperties: true },
        },
      },
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
      ValidationError: {
        type: "object",
        properties: {
          status: { type: "string", example: "error" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "email" },
                message: { type: "string", example: "Invalid email" },
              },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          role: { type: "string", enum: ["job_seeker", "company_admin", "super_admin"], example: "job_seeker" },
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
          coverImage: { type: "string", nullable: true, example: "https://storage.example.com/cover.png" },
          foundedYear: { type: "integer", nullable: true, example: 2015 },
          officeCount: { type: "integer", nullable: true, example: 3 },
          gallery: { type: "array", items: { type: "string" }, example: ["https://storage.example.com/office1.jpg", "https://storage.example.com/office2.jpg"] },
          specialties: { type: "array", items: { type: "string" }, example: ["AI", "Cloud", "SaaS"] },
          mapUrl: { type: "string", nullable: true, example: "https://maps.google.com/?q=New+York" },
          latitude: { type: "number", format: "float", nullable: true, example: 40.7128 },
          longitude: { type: "number", format: "float", nullable: true, example: -74.0060 },
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
          salaryNegotiable: { type: "boolean", example: false },
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
          status: { type: "string", enum: ["pending", "reviewed", "accepted", "rejected"], example: "pending" },
          userId: { type: "integer", example: 1 },
          jobId: { type: "integer", example: 1 },
          appliedDate: { type: "string", format: "date-time", example: "2023-10-01T12:00:00Z" }
        }
      },
      UpdateApplicationStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["pending", "reviewed", "accepted", "rejected"], example: "reviewed" },
        },
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
        required: ["title", "description", "location", "jobType", "requirements", "benefits"],
        properties: {
          title: { type: "string", example: "Backend Engineer" },
          description: { type: "string", example: "Node.js + Prisma + PostgreSQL" },
          location: { type: "string", example: "Phnom Penh" },
          jobType: { type: "string", enum: ["full_time", "part_time", "contract", "internship", "remote"], example: "full_time" },
          requirements: { type: "string", example: "Node.js, Express, Postgres" },
          benefits: { type: "string", example: "13th month salary" },
          salaryNegotiable: { type: "boolean", example: true },
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
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Engineering" },
        },
      },
      Location: {
        type: "object",
        properties: {
          location: { type: "string", example: "Remote" },
        },
      },
      GlobalStats: {
        type: "object",
        additionalProperties: { type: ["integer", "number", "string", "boolean", "null"] },
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "New application received" },
          message: { type: "string", example: "A candidate has applied to your job posting." },
          read: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time", example: "2026-05-24T12:00:00Z" },
        },
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
          429: { description: "Too many attempts (rate limited)" },
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
          429: { description: "Too many attempts (rate limited)" },
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
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh the access token using the refresh cookie",
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: "Access token refreshed" },
          401: { description: "Not authorized" },
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
    // -------------------------------- JOBS --------------------------------
    "/api/v1/jobs": {
      get: {
        tags: ["Jobs"],
        summary: "Get all jobs with pagination & filtering",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "List of jobs returned" },
          401: { description: "Not authorized" },
        },
      },
    },
    "/api/v1/jobs/saved": {
      get: {
        tags: ["Jobs"],
        summary: "Get current user's saved jobs",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Saved jobs returned" },
          401: { description: "Not authorized" },
        },
      },
    },
    "/api/v1/jobs/{id}": {
      get: {
        tags: ["Jobs"],
        summary: "Get specific job by ID",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Job details returned" },
          404: { description: "Job not found" },
          401: { description: "Not authorized" },
        },
      },
      put: {
        tags: ["Jobs"],
        summary: "Update job listing",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CreateJobRequest" } } } },
        responses: {
          200: { description: "Job updated" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires company_admin role" },
        },
      },
      delete: {
        tags: ["Jobs"],
        summary: "Delete job listing",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Job deleted" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires company_admin role" },
        },
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
        responses: {
          201: { description: "Job created" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires company_admin role" },
        },
      },
    },
    "/api/v1/jobs/{id}/save": {
      post: {
        tags: ["Jobs"],
        summary: "Toggle save/unsave a job for current user",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Saved/unsaved successfully" },
          401: { description: "Not authorized" },
        },
      },
    },

    // -------------------------------- LOOKUP / PUBLIC DATA --------------------------------
    "/api/v1/categories": {
      get: {
        tags: ["Lookup"],
        summary: "Get all job categories",
        responses: {
          200: {
            description: "Categories returned",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Category" },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/locations": {
      get: {
        tags: ["Lookup"],
        summary: "Get job locations",
        responses: {
          200: {
            description: "Locations returned",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Location" },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/stats": {
      get: {
        tags: ["Dashboard"],
        summary: "Get global platform stats",
        responses: {
          200: {
            description: "Global stats returned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GlobalStats" },
              },
            },
          },
        },
      },
    },

    // -------------------------------- NOTIFICATIONS --------------------------------
    "/api/v1/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get notifications for the current user",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: "Notifications returned",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Notification" },
                },
              },
            },
          },
          401: { description: "Not authorized" },
        },
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
    "/api/v1/users/me/stats": {
      get: {
        tags: ["Users"],
        summary: "Get current user's application stats",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "User stats returned" },
          401: { description: "Not authorized" },
        },
      },
    },
    "/api/v1/users": {
      get: {
        tags: ["Admin"],
        summary: "Get all users (Super Admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Users returned" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires super_admin role" },
        },
      },
    },
    "/api/v1/users/profile/{id}": {
      put: {
        tags: ["Admin"],
        summary: "Update any user's profile (Super Admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProfileRequest" } } } },
        responses: {
          200: { description: "User updated" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires super_admin role" },
        },
      },
    },
    "/api/v1/users/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete a user (Super Admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "User deleted" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires super_admin role" },
        },
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
    "/api/v1/companies/cover": {
      post: {
        tags: ["Companies"],
        summary: "Upload company cover image",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", properties: { cover: { type: "string", format: "binary" } } } } },
        },
        responses: { 200: { description: "Cover uploaded" } },
      },
      delete: {
        tags: ["Companies"],
        summary: "Delete company cover image",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { 200: { description: "Cover deleted" } },
      },
    },
    "/api/v1/companies/upload": {
      post: {
        tags: ["Companies"],
        summary: "Upload a company gallery asset",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } },
        },
        responses: { 200: { description: "Gallery asset uploaded" } },
      },
    },
    "/api/v1/companies/me/stats": {
      get: {
        tags: ["Companies"],
        summary: "Get current company stats (Company Admin)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Company stats returned" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires company_admin role" },
        },
      },
    },
    "/api/v1/companies/me/jobs": {
      get: {
        tags: ["Companies"],
        summary: "Get jobs posted by the current company",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Company jobs returned" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires company_admin role" },
        },
      },
    },
    "/api/v1/companies/me": {
      get: {
        tags: ["Companies"],
        summary: "Get current company profile",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Company profile returned" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires company_admin role" },
        },
      },
      put: {
        tags: ["Companies"],
        summary: "Update current company profile",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCompanyRequest" } } } },
        responses: {
          200: { description: "Company profile updated" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires company_admin role" },
        },
      },
    },

    // -------------------------------- ADMIN --------------------------------
    "/api/v1/users/{id}/suspend": {
      put: {
        tags: ["Admin"],
        summary: "Suspend or un-suspend a user account",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reason: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User suspension updated" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires super_admin role" },
        },
      },
    },
    "/api/v1/users/{id}/warn": {
      put: {
        tags: ["Admin"],
        summary: "Warn a user account",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reason: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User warned" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires super_admin role" },
        },
      },
    },
    "/api/v1/companies/{id}/suspend": {
      put: {
        tags: ["Admin"],
        summary: "Suspend or un-suspend a company account",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reason: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Company suspension updated" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires super_admin role" },
        },
      },
    },
    "/api/v1/companies/{id}/warn": {
      put: {
        tags: ["Admin"],
        summary: "Warn a company account",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  reason: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Company warned" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires super_admin role" },
        },
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
    "/api/v1/applications/{id}": {
      delete: {
        tags: ["Applications"],
        summary: "Withdraw an application (Job Seeker)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "Application ID" }],
        responses: {
          200: { description: "Application withdrawn" },
          401: { description: "Not authorized" },
        },
      },
    },
    "/api/v1/applications/company": {
      get: {
        tags: ["Applications"],
        summary: "Get all applicants for the current company",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Company applicants returned" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden - Requires company_admin role" },
        },
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
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateApplicationStatusRequest" } } },
        },
        responses: { 200: { description: "Application status updated" } },
      },
    },
    "/auth/github": {
      get: {
        tags: ["OAuth"],
        summary: "Start GitHub OAuth login",
        responses: {
          302: { description: "Redirect to GitHub OAuth consent screen" },
        },
      },
    },
    "/auth/github/callback": {
      get: {
        tags: ["OAuth"],
        summary: "GitHub OAuth callback (sets JWT cookie / redirects to frontend)",
        responses: {
          302: { description: "Redirect back to frontend with token query param" },
          401: { description: "Authentication failed" },
        },
      },
    },
    "/auth/linkedin": {
      get: {
        tags: ["OAuth"],
        summary: "Start LinkedIn OAuth login",
        responses: {
          302: { description: "Redirect to LinkedIn OAuth consent screen" },
        },
      },
    },
    "/auth/linkedin/callback": {
      get: {
        tags: ["OAuth"],
        summary: "LinkedIn OAuth callback (sets JWT cookie / redirects to frontend)",
        responses: {
          302: { description: "Redirect back to frontend with token query param" },
          401: { description: "Authentication failed" },
        },
      },
    },
  },
};

export default openApiDocument;
