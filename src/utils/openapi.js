const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Job Portal Backend API",
    version: "1.0.0",
    description: "API documentation for auth and job endpoints.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local development",
    },
  ],
  tags: [{ name: "Auth" }, { name: "Jobs" }],
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
          message: {
            type: "string",
            example: "Operation completed successfully",
          },
        },
      },
      ErrorMessage: {
        type: "object",
        properties: {
          message: { type: "string", example: "Forbidden" },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "devqii" },
          email: {
            type: "string",
            format: "email",
            example: "devqii@gmail.com",
          },
          role: {
            type: "string",
            enum: ["job_seeker", "company_admin"],
            example: "company_admin",
          },
          companyId: { type: "integer", nullable: true, example: 1 },
        },
      },
      Job: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Backend Engineer" },
          location: { type: "string", example: "Singapore" },
          jobType: {
            type: "string",
            enum: [
              "full_time",
              "part_time",
              "contract",
              "internship",
              "remote",
            ],
            example: "full_time",
          },
          description: { type: "string", example: "Develop APIs" },
          requirements: { type: "string", example: "Node.js, Prisma" },
          benefits: { type: "string", example: "Remote work" },
          salaryMin: { type: "integer", example: 1000 },
          salaryMax: { type: "integer", example: 3000 },
          status: { type: "string", enum: ["open", "closed"], example: "open" },
          companyId: { type: "integer", example: 1 },
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
        required: ["title", "location", "jobType"],
        properties: {
          title: { type: "string", example: "Backend Engineer" },
          location: { type: "string", example: "Phnom Penh" },
          jobType: {
            type: "string",
            enum: [
              "full_time",
              "part_time",
              "contract",
              "internship",
              "remote",
            ],
            example: "full_time",
          },
          description: {
            type: "string",
            example: "Node.js + Prisma + PostgreSQL",
          },
          salaryMin: { type: "integer", example: 400 },
          salaryMax: { type: "integer", example: 1200 },
        },
      },
    },
  },
  paths: {
    "/": {
      get: {
        tags: ["Auth"],
        summary: "Health/welcome endpoint",
        responses: {
          200: {
            description: "Welcome message",
            content: {
              "text/plain": {
                schema: {
                  type: "string",
                  example: "Welcome to the Job Portal API",
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
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
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
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
        responses: {
          200: {
            description: "Logged out successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessMessage" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/profile": {
      get: {
        tags: ["Auth"],
        summary: "Get current user profile",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: {
            description: "Profile returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/UserProfile" },
                      },
                    },
                  },
                },
              },
            },
          },
          401: {
            description: "Not authorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorMessage" },
              },
            },
          },
        },
      },
    },
    "/api/v1/jobs": {
      get: {
        tags: ["Jobs"],
        summary: "Get all jobs",
        parameters: [
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Search by job title",
          },
          {
            name: "location",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Filter by location",
          },
          {
            name: "jobType",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: [
                "full_time",
                "part_time",
                "contract",
                "internship",
                "remote",
              ],
            },
            description: "Filter by job type",
          },
          {
            name: "minSalary",
            in: "query",
            required: false,
            schema: { type: "integer" },
            description: "Minimum salary",
          },
          {
            name: "maxSalary",
            in: "query",
            required: false,
            schema: { type: "integer" },
            description: "Maximum salary",
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1 },
            description: "Page number",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", default: 10 },
            description: "Items per page",
          },
          {
            name: "sort",
            in: "query",
            required: false,
            schema: {
              type: "string",
              enum: ["createdAt", "salaryMin", "salaryMax"],
              default: "createdAt",
            },
            description: "Sort field",
          },
          {
            name: "order",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
            description: "Sort order",
          },
        ],
        responses: {
          200: {
            description: "Job list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Job" },
                    },
                    meta: {
                      type: "object",
                      properties: {
                        total: { type: "integer", example: 42 },
                        page: { type: "integer", example: 1 },
                        limit: { type: "integer", example: 10 },
                        totalPages: { type: "integer", example: 5 },
                        sort: { type: "string", example: "createdAt" },
                        order: { type: "string", example: "desc" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/jobs/{id}": {
      get: {
        tags: ["Jobs"],
        summary: "Get job by id",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Job details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "success" },
                    data: { $ref: "#/components/schemas/Job" },
                  },
                },
              },
            },
          },
          404: {
            description: "Job not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorMessage" },
              },
            },
          },
        },
      },
      put: {
        tags: ["Jobs"],
        summary: "Update job (company admin only)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateJobRequest" },
            },
          },
        },
        responses: {
          200: { description: "Job updated" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden" },
        },
      },
      delete: {
        tags: ["Jobs"],
        summary: "Delete job (company admin only)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Job deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessMessage" },
              },
            },
          },
          401: { description: "Not authorized" },
          403: { description: "Forbidden" },
          404: { description: "Job not found" },
        },
      },
    },
    "/api/v1/jobs/create": {
      post: {
        tags: ["Jobs"],
        summary: "Create a job (company admin only)",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateJobRequest" },
            },
          },
        },
        responses: {
          201: { description: "Job created" },
          401: { description: "Not authorized" },
          403: { description: "Forbidden" },
        },
      },
    },
  },
};

export default openApiDocument;
