import { prisma } from "../config/db.js";
// This file is for the business logic of the job, it will be called by the controller and it will call the database to perform the CRUD operations on the job model
const createJobService = async (data, user) => {
  if (!user || !user.companyId) {
    throw new Error("Forbidden");
  }

  return prisma.job.create({
    //.job is the name of the model in prisma schema.prisma file, .create is the method to create a new record in the database
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
