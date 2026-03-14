import { prisma } from "../config/db.js";

const createJobService = async (data) => {
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
      companyId: data.companyId,
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

export { createJobService, getJobs, getJobById };
