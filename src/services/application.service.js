import { prisma } from "../config/db.js";

const SUPER_ADMIN_ROLE = "super_admin";

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

  const existingApplication = await prisma.application.findUnique({
    where: {
      userId_jobId: { userId: Number(userId), jobId: Number(jobId) },
    },
  });

  const includeConfig = {
    user: {
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        headline: true,
      },
    },
    job: {
      select: {
        id: true,
        title: true,
        companyId: true,
        company: {
          select: {
            companyName: true,
            logo: true,
          },
        },
      },
    },
  };

  if (existingApplication) {
    const nextCount = existingApplication.applyCount + 1;
    const nextStatus = nextCount > 3 ? "spam" : "pending";

    return prisma.application.update({
      where: {
        id: existingApplication.id,
      },
      data: {
        coverLetter: data.coverLetter || null,
        applyCount: nextCount,
        status: nextStatus,
        appliedDate: new Date(),
      },
      include: includeConfig,
    });
  }

  // Create application
  return prisma.application.create({
    data: {
      jobId,
      userId,
      coverLetter: data.coverLetter || null,
      applyCount: 1,
      status: "pending",
    },
    include: includeConfig,
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

  if (!user || (user.role !== SUPER_ADMIN_ROLE && user.companyId !== job.companyId)) {
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
          phone: true,
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
  if (!user || (user.role !== SUPER_ADMIN_ROLE && user.companyId !== application.job.companyId)) {
    throw new Error("Forbidden: You cannot manage applications for other companies");
  }

  return prisma.application.update({
    where: { id: applicationId },
    data: { status },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          headline: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          companyId: true,
          company: {
            select: {
              companyName: true,
              logo: true,
            },
          },
        },
      },
    },
  });
};

const withdrawApplicationService = async (applicationId, user) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  // Only the user who applied can withdraw
  if (application.userId !== user.id) {
    throw new Error("Forbidden: You can only withdraw your own applications");
  }

  return prisma.application.delete({
    where: { id: applicationId },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          companyId: true,
        },
      },
    },
  });
};

const getCompanyApplicantsService = async (user) => {
  if (!user) {
    throw new Error("Forbidden: You must be associated with a company");
  }

  const isSuperAdmin = user.role === SUPER_ADMIN_ROLE;

  if (!isSuperAdmin && !user.companyId) {
    throw new Error("Forbidden: You must be associated with a company");
  }

  return prisma.application.findMany({
    where: isSuperAdmin ? {} : {
      job: {
        companyId: user.companyId,
      },
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          location: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          headline: true,
          avatar: true,
          resume: true,
          skills: true,
          bio: true,
          phone: true,
        },
      },
    },
    orderBy: { appliedDate: "desc" },
  });
};

export {
  applyToJobService,
  getMyApplicationsService,
  getApplicantsForJobService,
  getCompanyApplicantsService,
  updateApplicationStatusService,
  withdrawApplicationService,
};


