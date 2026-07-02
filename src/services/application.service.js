import { prisma } from "../config/db.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../lib/errors.js";
import { appSettings } from "../config/settings.cache.js";

const SUPER_ADMIN_ROLE = "super_admin";

const getSpamThreshold = () => {
  const value = appSettings["spam_apply_threshold"];
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
};

const applyToJobService = async (jobId, userId, data) => {
  // Check if job exists and is open
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new NotFoundError("Job not found");
  }

  if (job.status !== "open") {
    throw new BadRequestError("Job is no longer accepting applications");
  }

  const now = new Date();
  if (job.startDate && job.startDate > now) {
    throw new BadRequestError("This job is not open for applications yet");
  }
  if (job.endDate && job.endDate < now) {
    throw new BadRequestError("The application deadline for this job has passed");
  }

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
            isVerified: true,
          },
        },
      },
    },
  };

  return await prisma.$transaction(async (tx) => {
    let application = await tx.application.upsert({
      where: {
        userId_jobId: { userId: Number(userId), jobId: Number(jobId) },
      },
      update: {
        coverLetter: data.coverLetter || null,
        applyCount: { increment: 1 },
        appliedDate: new Date(),
      },
      create: {
        jobId,
        userId,
        coverLetter: data.coverLetter || null,
        applyCount: 1,
        status: "pending",
      },
      include: includeConfig,
    });

    if (application.applyCount >= getSpamThreshold() && application.status !== "spam") {
      application = await tx.application.update({
        where: { id: application.id },
        data: { status: "spam" },
        include: includeConfig,
      });
    }

    return application;
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
              isVerified: true,
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
    throw new NotFoundError("Job not found");
  }

  if (!user || (user.role !== SUPER_ADMIN_ROLE && user.companyId !== job.companyId)) {
    throw new ForbiddenError("You can only view applicants for your own company jobs");
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
    throw new NotFoundError("Application not found");
  }

  // Check if user is the admin of the company that posted the job
  if (!user || (user.role !== SUPER_ADMIN_ROLE && user.companyId !== application.job.companyId)) {
    throw new ForbiddenError("You cannot manage applications for other companies");
  }

  return prisma.$transaction(async (tx) => {
    const updatedApplication = await tx.application.update({
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
                isVerified: true,
              },
            },
          },
        },
      },
    });

    if (updatedApplication.status !== application.status) {
      await tx.warningLog.create({
        data: {
          reason: [
            `[APPLICATION_STATUS] applicationId=${applicationId}`,
            `from=${application.status}`,
            `to=${status}`,
            `jobId=${application.jobId}`,
            `companyId=${application.job.companyId}`,
          ],
          issuedById: Number(user.id),
          targetUserId: updatedApplication.userId,
          targetCompanyId: application.job.companyId,
        },
      });
    }

    return updatedApplication;
  });
};

const withdrawApplicationService = async (applicationId, user) => {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    throw new NotFoundError("Application not found");
  }

  // Only the user who applied can withdraw
  if (application.userId !== user.id) {
    throw new ForbiddenError("You can only withdraw your own applications");
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
    throw new ForbiddenError("You must be associated with a company");
  }

  const isSuperAdmin = user.role === SUPER_ADMIN_ROLE;

  if (!isSuperAdmin && !user.companyId) {
    throw new ForbiddenError("You must be associated with a company");
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



