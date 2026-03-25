import { prisma } from "../config/db.js";

const applyToJobService = async (jobId, userId, data) => {
  // Check if job exists and is open
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (job.status !== "open") {
    throw new Error("Job is no longer accepting applications");
  }

  // Create application
  return prisma.application.create({
    data: {
      jobId,
      userId,
      coverLetter: data.coverLetter || null,
    },
  });
};

const getMyApplicationsService = async (userId) => {
  return prisma.application.findMany({
    where: { userId },
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
    orderBy: { appliedDate: "desc" },
  });
};

const getApplicantsForJobService = async (jobId, user) => {
  // Only company admin of THAT company can see applicants
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error("Job not found");
  }

  if (!user || user.companyId !== job.companyId) {
    throw new Error("Forbidden: You can only view applicants for your own company jobs");
  }

  return prisma.application.findMany({
    where: { jobId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          headline: true,
          bio: true,
          avatar: true,
          resume: true,
          skills: true,
        },
      },
    },
    orderBy: { appliedDate: "desc" },
  });
};

const updateApplicationStatusService = async (applicationId, status, user) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  // Check if user is the admin of the company that posted the job
  if (!user || user.companyId !== application.job.companyId) {
    throw new Error("Forbidden: You cannot manage applications for other companies");
  }

  return prisma.application.update({
    where: { id: applicationId },
    data: { status },
  });
};

export {
  applyToJobService,
  getMyApplicationsService,
  getApplicantsForJobService,
  updateApplicationStatusService,
};
