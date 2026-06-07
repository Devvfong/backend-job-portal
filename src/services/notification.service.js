import { prisma } from "../config/db.js";

const normalizeNotification = (notification) => ({
  ...notification,
  createdAt: notification.createdAt ?? notification.time,
});

const getApplicationNotificationIds = (applicationId) => ([
  `app-pending-${applicationId}`,
  `app-reviewed-${applicationId}`,
  `app-accepted-${applicationId}`,
  `app-rejected-${applicationId}`,
  `new-applicant-${applicationId}`,
]);

const buildSeekerApplicationNotification = (application, eventTime = null) => {
  const jobTitle = application.job?.title || "a job";
  const companyName = application.job?.company?.companyName || "a company";
  const logo = application.job?.company?.logo || null;
  const time = eventTime ?? application.appliedDate;

  if (application.status === "reviewed") {
    return normalizeNotification({
      id: `app-reviewed-${application.id}`,
      applicationId: application.id,
      type: "status_change",
      icon: "eye",
      title: "Application Reviewed",
      message: `Your application for "${jobTitle}" at ${companyName} is being reviewed.`,
      time,
      read: false,
      avatar: logo,
      link: "/dashboard/seeker/applications",
    });
  }

  if (application.status === "accepted") {
    return normalizeNotification({
      id: `app-accepted-${application.id}`,
      applicationId: application.id,
      type: "accepted",
      icon: "star",
      title: "Application Accepted! 🎉",
      message: `Congratulations! Your application for "${jobTitle}" at ${companyName} has been accepted.`,
      time,
      read: false,
      avatar: logo,
      link: "/dashboard/seeker/applications",
    });
  }

  if (application.status === "rejected") {
    return normalizeNotification({
      id: `app-rejected-${application.id}`,
      applicationId: application.id,
      type: "rejected",
      icon: "x",
      title: "Application Update",
      message: `Your application for "${jobTitle}" at ${companyName} was not selected this time.`,
      time,
      read: false,
      avatar: logo,
      link: "/dashboard/seeker/applications",
    });
  }

  return normalizeNotification({
    id: `app-pending-${application.id}`,
    applicationId: application.id,
    type: "applied",
    icon: "check",
    title: "Application Submitted",
    message: `You applied for "${jobTitle}" at ${companyName}. Good luck!`,
    time,
    read: false,
    avatar: logo,
    link: "/dashboard/seeker/applications",
  });
};

const buildNewApplicantNotification = (application) => {
  const applicantName = application.user?.name || "Someone";
  const jobTitle = application.job?.title || "your job";

  return normalizeNotification({
    id: `new-applicant-${application.id}`,
    applicationId: application.id,
    type: "new_applicant",
    icon: "user",
    title: "New Applicant",
    message: `${applicantName} applied for "${jobTitle}".`,
    time: application.appliedDate,
    read: false,
    avatar: application.user?.avatar || null,
    link: "/dashboard/company/jobs",
  });
};

const buildSuperAdminApplicationNotification = (application) => {
  const applicantName = application.user?.name || "Someone";
  const jobTitle = application.job?.title || "a job";
  const companyName = application.job?.company?.companyName || "a company";

  return normalizeNotification({
    id: `admin-applicant-${application.id}`,
    applicationId: application.id,
    type: "new_applicant",
    icon: "shield",
    title: "Platform Application Activity",
    message: `${applicantName} applied for "${jobTitle}" at ${companyName}.`,
    time: application.appliedDate,
    read: false,
    avatar: application.user?.avatar || null,
    link: "/dashboard/admin",
  });
};

const buildNewJobNotification = (job) => {
  const companyName = job.company?.companyName || "a company";

  return normalizeNotification({
    id: `new-job-${job.id}`,
    jobId: job.id,
    type: "new_job",
    icon: "briefcase",
    title: "New Job Match",
    message: `New opening for "${job.title}" at ${companyName}. Check it out!`,
    time: job.createdAt,
    read: false,
    avatar: job.company?.logo || null,
    link: `/jobs?id=${job.id}`,
  });
};

const buildApplicationRemovalPayload = (applicationId) => ({
  applicationId,
  ids: getApplicationNotificationIds(applicationId),
});

const getNotificationsForUser = async (user) => {
  const notifications = [];

  if (user.role === "job_seeker") {
    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: {
        job: {
          include: {
            company: { select: { companyName: true, logo: true } },
          },
        },
      },
      orderBy: { appliedDate: "desc" },
      take: 20,
    });

    for (const application of applications) {
      notifications.push(buildSeekerApplicationNotification(application));
    }

    const recentJobs = await prisma.job.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        status: "open",
      },
      include: { company: { select: { companyName: true, logo: true } } },
      take: 5,
    });

    for (const job of recentJobs) {
      notifications.push(buildNewJobNotification(job));
    }
  } else if (user.role === "company_admin" && user.companyId) {
    const applications = await prisma.application.findMany({
      where: {
        job: { companyId: user.companyId },
        appliedDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        job: { select: { id: true, title: true } },
        user: { select: { id: true, name: true, avatar: true, headline: true } },
      },
      orderBy: { appliedDate: "desc" },
      take: 20,
    });

    for (const application of applications) {
      notifications.push(buildNewApplicantNotification(application));
    }
  } else if (user.role === "super_admin") {
    const applications = await prisma.application.findMany({
      where: {
        appliedDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: { select: { companyName: true, logo: true } },
          },
        },
        user: { select: { id: true, name: true, avatar: true, headline: true } },
      },
      orderBy: { appliedDate: "desc" },
      take: 20,
    });

    for (const application of applications) {
      notifications.push(buildSuperAdminApplicationNotification(application));
    }
  }

  notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

  return notifications.slice(0, 15);
};

export {
  buildSeekerApplicationNotification,
  buildNewApplicantNotification,
  buildSuperAdminApplicationNotification,
  buildNewJobNotification,
  buildApplicationRemovalPayload,
  getNotificationsForUser,
};