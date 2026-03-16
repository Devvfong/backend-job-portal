import { id } from "zod/locales";
import { prisma } from "../config/db.js";

const createJobService = async (data) => {
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
const updateJob = async (id, data) => {
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
    },
  });
};
const deletJob = async (id) => {
  const job = await prisma.job.findUnique({
    where: { id },
  });
  try {
    if (!job) {
      throw new Error("Job not found");
    }
  } catch (error) {
    throw error;
  }
  return prisma.job.delete({
    where: { id },
  });
};
export { createJobService, getJobs, getJobById, updateJob, deletJob };
