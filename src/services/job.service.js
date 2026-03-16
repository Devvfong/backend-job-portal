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

const getJobs = async () => {
  return prisma.job.findMany({
    where: { status: "open" },
  });
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
      title: data.title,
      location: data.location,
      jobType: data.jobType,
      description: data.description,
      requirements: data.requirements,
      benefits: data.benefits,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
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
