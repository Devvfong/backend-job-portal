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
          200: { description: "Logged out successfully" },
        },
      },
    },
    "/api/v1/auth/profile": {
      get: {
        tags: ["Auth"],
        summary: "Get current user profile",
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: "Profile returned" },
          401: { description: "Not authorized" },
        },
      },
    },
    "/api/v1/jobs": {
      get: {
        tags: ["Jobs"],
        summary: "Get all jobs",
        responses: {
          200: { description: "Job list" },
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
          200: { description: "Job details" },
          404: { description: "Job not found" },
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
