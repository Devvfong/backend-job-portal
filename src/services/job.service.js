import { prisma } from "../config/db.js";

const createJobService = async (data, user) => {
  if (!user) {
    throw new Error("Forbidden user not authenticated");
  }

  const companyId = data.companyId || user.companyId; // this for 
  if (!companyId) {
    throw new Error("A companyId must be provided in the request body or linked to your account");
  }
  const duplicated = await prisma.job.findFirst({
    where: {
      companyId: Number(companyId),
      title: data.title,
      location: data.location,
      jobType: data.jobType,
      description: data.description,
      requirements: data.requirements,
      benefits: data.benefits,
      salaryMin: data.salaryMin ? Number(data.salaryMin) : undefined,
      salaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
    },
  })
  if (duplicated) {
    throw new Error("A job with identical details already exists for this company");
  }
  else if (!duplicated) {
    return prisma.job.create({
      data: {
        companyId: Number(companyId),
        title: data.title,
        location: data.location,
        jobType: data.jobType,
        description: data.description,
        requirements: data.requirements,
        benefits: data.benefits,
        salaryMin: data.salaryMin ? Number(data.salaryMin) : undefined,
        salaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
      },
    });
  }
}

// Get all jobs with filters and pagination
const getJobService = async (query) => {
  const {
    search,
    location,
    jobType,
    category,
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
    where.title = {
      contains: String(search),
      mode: "insensitive",
    };
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

  if (minSalary || maxSalary) {
    where.salaryMin = {};
    if (minSalary) where.salaryMin.gte = Number(minSalary);
    if (maxSalary) where.salaryMin.lte = Number(maxSalary);
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
            companyName: true,
            logo: true,
            location: true,
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
    throw new Error("Job not found");
  }

  // Verify permissions: process.env.SERVER bypass or company ownership
  const isSuperAdmin = user?.role === process.env.SERVER;
  const isCompanyAdmin = user?.role === "company_admin" && job.companyId === user.companyId;

  if (!isSuperAdmin && !isCompanyAdmin) {
    throw new Error("Forbidden");
  }

  // Only allow updating companyId if process.env.SERVER
  const updateData = {
    title: data.title || job.title,
    location: data.location || job.location,
    jobType: data.jobType || job.jobType,
    description: data.description || job.description,
    requirements: data.requirements || job.requirements,
    benefits: data.benefits || job.benefits,
    salaryMin: data.salaryMin ? Number(data.salaryMin) : job.salaryMin,
    salaryMax: data.salaryMax ? Number(data.salaryMax) : job.salaryMax,
    status: data.status || job.status,
  };

  if (isSuperAdmin && data.companyId) {
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
    throw new Error("Job not found");
  }

  // Check if already saved using the compound unique key we made in schema
  const existingSave = await prisma.savedJob.findUnique({
    where: {
      userId_jobId: {
        userId: user.id, // this is the compound unique key
        jobId: job.id, // this is the compound unique key
      },
    },
  });

  if (existingSave) {
    await prisma.savedJob.delete({
      where: { id: existingSave.id },
    });
    return { status: "unsaved", message: "Job removed from saved list" };
  } else {
    const savedJob = await prisma.savedJob.create({
      data: {
        userId: user.id,
        jobId: job.id,
      },
    });
    return { status: "saved", data: savedJob };
  }
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
              companyName: true,
              logo: true,
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
    throw new Error("Job not found");
  }

  // Verify permissions: process.env.SERVER bypass or company ownership
  const isSuperAdmin = user?.role === process.env.SERVER;
  const isCompanyAdmin = user?.role === 'company_admin' && job.companyId === user.companyId;

  if (!isSuperAdmin && !isCompanyAdmin) {
    throw new Error("Forbidden");
  }

  return prisma.job.delete({
    where: { id },
  });
};

const getMyCompanyJobsService = async (user) => {
  if (!user || !user.companyId) {
    throw new Error("Admin account is not linked to a company");
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

export {
  createJobService,
  getJobService,
  getJobByIdService,
  updateJobService,
  deleteJobService,
  toggleSaveJobService,
  getSavedJobsService,
  getMyCompanyJobsService,
};
