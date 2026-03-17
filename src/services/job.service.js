import { prisma } from "../config/db.js";

const createJobService = async (data, user) => {
  if (!user) {
    throw new Error("Forbidden");
  }

  if (!user.companyId) {
    throw new Error("Admin account is not linked to a company");
  }

  return prisma.job.create({
    data: {
      title: data.title,
      location: data.location,
      jobType: data.jobType,
      description: data.description,
      requirements: data.requirements,
      benefits: data.benefits,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      companyId: user.companyId, // from DB user only
    },
  });
};

const getJobs = async (query) => {
  const {
    search,
    location,
    jobType,
    minSalary,
    maxSalary,
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
  } = query;

  const pageNumber = Math.max(1, Number(page) || 1); // Ensure page is at least 1
  const limitNumber = Math.min(100, Math.max(1, Number(limit) || 10)); // Ensure limit is between 1 and 100
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

  if (minSalary || maxSalary) {
    where.salaryMin = {};

    if (minSalary) {
      where.salaryMin.gte = Number(minSalary);
    }

    if (maxSalary) {
      where.salaryMin.lte = Number(maxSalary);
    }
  }

  const allowedSortFields = ["createdAt", "salaryMin", "salaryMax"];
  const sortField = allowedSortFields.includes(sort) ? sort : "createdAt";
  const sortOrder = order === "asc" ? "asc" : "desc";

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: {
        [sortField]: sortOrder,
      },
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

const getJobById = async (id) => {
  return prisma.job.findFirst({
    where: {
      id: id,
      status: "open",
    },
  });
};

const updateJob = async (id, data, user) => {
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (!user || job.companyId !== user.companyId) {
    throw new Error("Forbidden");
  }

  return prisma.job.update({
    where: { id },
    data: {
      title: data.title || job.title,
      location: data.location || job.location,
      jobType: data.jobType || job.jobType,
      description: data.description || job.description,
      requirements: data.requirements || job.requirements,
      benefits: data.benefits || job.benefits,
      salaryMin: data.salaryMin || job.salaryMin,
      salaryMax: data.salaryMax || job.salaryMax,
      companyId: user.companyId,
    },
  });
};

const deletJob = async (id, user) => {
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (!user || job.companyId !== user.companyId) {
    throw new Error("Forbidden");
  }

  return prisma.job.delete({
    where: { id },
  });
};

export { createJobService, getJobs, getJobById, updateJob, deletJob };
