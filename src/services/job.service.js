import { prisma } from "../config/db.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../lib/errors.js";

const createJobService = async (data, user) => {
  // super_admin can optionally pass companyId in the body to create jobs for any company;
  // otherwise the job is created for the user's linked company
  const isSuperAdmin = user?.role === "super_admin";
  const companyId = isSuperAdmin && data.companyId ? data.companyId : user?.companyId;

  if (!companyId) {
    throw new BadRequestError("Admin account is not linked to a company");
  }
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const salaryMin = data.salaryMin != null ? Number(data.salaryMin) : null;
  const salaryMax = data.salaryMax != null ? Number(data.salaryMax) : null;
  const storedSalaryMin = data.salaryNegotiable ? null : salaryMin;
  const storedSalaryMax = data.salaryNegotiable ? null : salaryMax;
  const company = await prisma.company.findUnique({
    where: { id: Number(companyId) },
    select: { id: true },
  });
  if (!company) {
    throw new NotFoundError("Company not found");
  }

  const duplicated = await prisma.job.findFirst({
    where: {
      companyId: Number(companyId),
      title: data.title,
      location: data.location,
      jobType: data.jobType,
      description: data.description,
      requirements: data.requirements || "",
      benefits: data.benefits || "",
      salaryNegotiable: Boolean(data.salaryNegotiable),
      salaryMin: storedSalaryMin,
      salaryMax: storedSalaryMax,
      category: data.category || null,
      skills: { equals: skills },
      tags: { equals: tags },
    },
  })
  if (duplicated) {
    throw new BadRequestError("A job with identical details already exists for this company");
  }

  return prisma.job.create({
      data: {
        companyId: Number(companyId),
        title: data.title,
        location: data.location,
        jobType: data.jobType,
        description: data.description,
        requirements: data.requirements || "",
        benefits: data.benefits || "",
        salaryNegotiable: Boolean(data.salaryNegotiable),
        salaryMin: storedSalaryMin,
        salaryMax: storedSalaryMax,
        category: data.category || null,
        skills,
        tags,
      },
      include: {
        company: { select: { companyName: true, logo: true } },
      },
    });
}

// Get all jobs with filters and pagination
const getJobService = async (query) => {
  const {
    search,
    location,
    jobType,
    category,
    companyId,
    minSalary,
    maxSalary,
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
  } = query;

  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * limitNumber;

  const where = {
    status: "open",
  };

  if (search) {
    const tokens = String(search).trim().split(/\s+/).filter(Boolean);
    if (tokens.length) {
      where.AND = tokens.map((token) => ({
        OR: [
          { title: { contains: token, mode: "insensitive" } },
          { description: { contains: token, mode: "insensitive" } },
          { company: { companyName: { contains: token, mode: "insensitive" } } },
        ],
      }));
    }
  }

  if (location) {
    where.location = {
      contains: String(location),
      mode: "insensitive",
    };
  }

  if (jobType) {
    where.jobType = String(jobType);
  }

  if (category) {
    where.category = String(category);
  }

  if (companyId) {
    where.companyId = Number(companyId);
  }

  if (minSalary || maxSalary) {
    // minSalary: jobs whose salary range starts at or above this value
    if (minSalary) {
      where.salaryMin = { ...where.salaryMin, gte: Number(minSalary) };
    }
    // maxSalary: jobs whose salary range ends at or below this value
    if (maxSalary) {
      where.salaryMax = { ...where.salaryMax, lte: Number(maxSalary) };
    }
  }

  const allowedSortFields = ["createdAt", "salaryMin", "salaryMax"];
  const sortField = allowedSortFields.includes(sort) ? sort : "createdAt";
  const sortOrder = order === "asc" ? "asc" : "desc";

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            location: true,
            isVerified: true,
          },
        },
      },
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limitNumber,
    }),
    prisma.job.count({ where }),
  ]);

  return {
    jobs,
    meta: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      sort: sortField,
      order: sortOrder,
    },
  };
};




// After (Adding the Company details)
const getJobByIdService = async (id) => {
  return prisma.job.findFirst({
    where: { id: id, status: "open" },
    include: {
      company: {
        select: {
          id: true,
          companyName: true,
          logo: true,
          industry: true,
          location: true,
          isVerified: true,
        }
      }
    }
  });
};


// File: src/services/job.service.js

const updateJobService = async (id, data, user) => {
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  // Verify permissions: super_admin bypass or company ownership
  const isSuperAdmin = user?.role === "super_admin";
  const isCompanyAdmin = user?.role === "company_admin" && job.companyId === user.companyId;

  if (!isSuperAdmin && !isCompanyAdmin) {
    throw new ForbiddenError("You do not have permission to update this job");
  }

  // Only allow updating companyId if super_admin
  const updateData = {};
  const has = (field) => Object.prototype.hasOwnProperty.call(data, field);

  if (has("title")) updateData.title = data.title;
  if (has("location")) updateData.location = data.location;
  if (has("jobType")) updateData.jobType = data.jobType;
  if (has("description")) updateData.description = data.description;
  if (has("requirements")) updateData.requirements = data.requirements ?? "";
  if (has("benefits")) updateData.benefits = data.benefits ?? "";
  if (has("category")) updateData.category = data.category || null;
  if (has("status")) updateData.status = data.status;
  if (has("skills")) updateData.skills = data.skills;
  if (has("tags")) updateData.tags = data.tags;

  if (has("salaryNegotiable")) {
    updateData.salaryNegotiable = data.salaryNegotiable;
    if (data.salaryNegotiable) {
      updateData.salaryMin = null;
      updateData.salaryMax = null;
    }
  }

  if (!data.salaryNegotiable && has("salaryMin")) {
    updateData.salaryMin = data.salaryMin == null ? null : Number(data.salaryMin);
  }
  if (!data.salaryNegotiable && has("salaryMax")) {
    updateData.salaryMax = data.salaryMax == null ? null : Number(data.salaryMax);
  }

  if (isSuperAdmin && data.companyId) {
    const company = await prisma.company.findUnique({ where: { id: Number(data.companyId) } });
    if (!company) {
      throw new NotFoundError("Company not found");
    }
    updateData.companyId = Number(data.companyId);
  }

  return prisma.job.update({
    where: { id },
    data: updateData,
  });
};
const toggleSaveJobService = async (jobId, user) => {
  const job = await prisma.job.findUnique({
    where: { id: Number(jobId) },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  // Atomic toggle using a transaction to prevent read-then-write race conditions.
  // The compound unique key (userId, jobId) prevents duplicates at the DB level.
  return prisma.$transaction(async (tx) => {
    const existingSave = await tx.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId: job.id,
        },
      },
    });

    if (existingSave) {
      await tx.savedJob.delete({
        where: { id: existingSave.id },
      });
      return { status: "unsaved", message: "Job removed from saved list" };
    }

    const savedJob = await tx.savedJob.create({
      data: {
        userId: user.id,
        jobId: job.id,
      },
    });
    return { status: "saved", data: savedJob };
  });
};

const getSavedJobsService = async (userId) => {
  const savedJobs = await prisma.savedJob.findMany({
    where: {
      userId: Number(userId),
    },
    include: {
      job: {
        include: {
          company: {
            select: {
              id: true,
              companyName: true,
              logo: true,
              isVerified: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return savedJobs;
};

const deleteJobService = async (id, user) => {
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  // Verify permissions: super_admin bypass or company ownership
  const isSuperAdmin = user?.role === "super_admin";
  const isCompanyAdmin = user?.role === 'company_admin' && job.companyId === user.companyId;

  if (!isSuperAdmin && !isCompanyAdmin) {
    throw new ForbiddenError("You do not have permission to delete this job");
  }

  return prisma.job.delete({
    where: { id },
  });
};

const getMyCompanyJobsService = async (user) => {
  if (!user || !user.companyId) {
    throw new BadRequestError("Admin account is not linked to a company");
  }

  return prisma.job.findMany({
    where: { companyId: user.companyId },
    include: {
      _count: {
        select: { applications: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getAdminJobsService = async (query = {}) => {
  const { search, status = "all", page = 1, limit = 50 } = query;
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(100, Math.max(1, Number(limit) || 50));
  const skip = (pageNumber - 1) * limitNumber;

  const where = {};
  if (status && status !== "all") {
    where.status = String(status);
  }

  if (search) {
    const tokens = String(search).trim().split(/\s+/).filter(Boolean);
    if (tokens.length) {
      where.AND = tokens.map((token) => ({
        OR: [
          { title: { contains: token, mode: "insensitive" } },
          { company: { companyName: { contains: token, mode: "insensitive" } } },
        ],
      }));
    }
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limitNumber,
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            logo: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.job.count({ where }),
  ]);

  return { jobs, total, page: pageNumber, limit: limitNumber };
};

export {
  createJobService,
  getJobService,
  getJobByIdService,
  updateJobService,
  deleteJobService,
  toggleSaveJobService,
  getSavedJobsService,
  getMyCompanyJobsService,
  getAdminJobsService,
};
