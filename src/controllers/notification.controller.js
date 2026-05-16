import { prisma } from "../config/db.js";

/**
 * GET /api/v1/notifications
 * Returns smart notifications derived from real application data.
 * - job_seeker: notified when their application status changes
 * - company_admin: notified when new applicants apply to their jobs
 */
const getNotificationsController = async (req, res) => {
  try {
    const user = req.user;
    const notifications = [];

    if (user.role === "job_seeker") {
      // Fetch recent applications with status changes
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

      for (const app of applications) {
        const jobTitle = app.job?.title || "a job";
        const company = app.job?.company?.companyName || "a company";
        const logo = app.job?.company?.logo || null;
        const time = app.appliedDate;

        if (app.status === "reviewed") {
          notifications.push({
            id: `app-reviewed-${app.id}`,
            type: "status_change",
            icon: "eye",
            title: "Application Reviewed",
            message: `Your application for "${jobTitle}" at ${company} is being reviewed.`,
            time,
            read: false,
            avatar: logo,
            link: "/dashboard/seeker/applications",
          });
        } else if (app.status === "accepted") {
          notifications.push({
            id: `app-accepted-${app.id}`,
            type: "accepted",
            icon: "star",
            title: "Application Accepted! 🎉",
            message: `Congratulations! Your application for "${jobTitle}" at ${company} has been accepted.`,
            time,
            read: false,
            avatar: logo,
            link: "/dashboard/seeker/applications",
          });
        } else if (app.status === "rejected") {
          notifications.push({
            id: `app-rejected-${app.id}`,
            type: "rejected",
            icon: "x",
            title: "Application Update",
            message: `Your application for "${jobTitle}" at ${company} was not selected this time.`,
            time,
            read: false,
            avatar: logo,
            link: "/dashboard/seeker/applications",
          });
        } else {
          notifications.push({
            id: `app-pending-${app.id}`,
            type: "applied",
            icon: "check",
            title: "Application Submitted",
            message: `You applied for "${jobTitle}" at ${company}. Good luck!`,
            time,
            read: false,
            avatar: logo,
            link: "/dashboard/seeker/applications",
          });
        }
      }

      // Add "New Jobs" discovery notifications
      const recentJobs = await prisma.job.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }, // Last 3 days
          status: "open",
        },
        include: { company: { select: { companyName: true, logo: true } } },
        take: 5,
      });

      for (const job of recentJobs) {
        notifications.push({
          id: `new-job-${job.id}`,
          type: "new_job",
          icon: "briefcase",
          title: "New Job Match",
          message: `New opening for "${job.title}" at ${job.company.companyName}. Check it out!`,
          time: job.createdAt,
          read: false,
          avatar: job.company.logo,
          link: `/jobs?id=${job.id}`,
        });
      }
    } else if (user.role === "company_admin" && user.companyId) {
      // Fetch recent applicants for company's jobs
      const applications = await prisma.application.findMany({
        where: {
          job: { companyId: user.companyId },
          appliedDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // last 7 days
          },
        },
        include: {
          job: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, avatar: true, headline: true } },
        },
        orderBy: { appliedDate: "desc" },
        take: 20,
      });

      for (const app of applications) {
        const applicantName = app.user?.name || "Someone";
        const jobTitle = app.job?.title || "your job";
        const avatar = app.user?.avatar || null;

        notifications.push({
          id: `new-applicant-${app.id}`,
          type: "new_applicant",
          icon: "user",
          title: "New Applicant",
          message: `${applicantName} applied for "${jobTitle}".`,
          time: app.appliedDate,
          read: false,
          avatar,
          link: `/dashboard/company/jobs`,
        });
      }
    }

    // Sort by most recent
    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    return res.status(200).json({
      status: "success",
      data: notifications.slice(0, 15),
      unread: notifications.length,
    });
  } catch (err) {
    console.error("Notification error:", err);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
};

export { getNotificationsController };
