import { prisma } from "../config/db.js";

const SUPER_ADMIN_ROLE = "super_admin";

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key) => {
  const month = key.split("-")[1];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[Number(month) - 1] ?? key;
};

const buildLast6MonthKeys = () => {
  const keys = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
};

const countByMonth = (rows, dateField) => {
  const counts = {};
  rows.forEach((row) => {
    const key = monthKey(row[dateField]);
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
};

const getGlobalStatsService = async () => {
  const [totalJobs, totalCompanies, totalUsers, totalApplications] = await Promise.all([
    prisma.job.count(),
    prisma.company.count(),
    prisma.user.count({ where: { role: { not: SUPER_ADMIN_ROLE } } }),
    prisma.application.count(),
  ]);

  return {
    totalJobs,
    totalCompanies,
    totalUsers,
    totalApplications,
  };
};

const getAdminDashboardService = async () => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthKeys = buildLast6MonthKeys();

  const [
    totals,
    openJobs,
    closedJobs,
    verifiedCompanies,
    unverifiedCompanies,
    suspendedUsers,
    suspendedCompanies,
    warnedUsers,
    warnedCompanies,
    newUsersThisWeek,
    newJobsThisWeek,
    newApplicationsThisWeek,
    applicationGroups,
  ] = await Promise.all([
    getGlobalStatsService(),
    prisma.job.count({ where: { status: "open" } }),
    prisma.job.count({ where: { status: "closed" } }),
    prisma.company.count({ where: { isVerified: true } }),
    prisma.company.count({ where: { isVerified: false } }),
    prisma.user.count({ where: { isSuspended: true, role: { not: SUPER_ADMIN_ROLE } } }),
    prisma.company.count({ where: { isSuspended: true } }),
    prisma.user.count({ where: { warningCount: { gt: 0 }, role: { not: SUPER_ADMIN_ROLE } } }),
    prisma.company.count({ where: { warningCount: { gt: 0 } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo }, role: { not: SUPER_ADMIN_ROLE } } }),
    prisma.job.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.application.count({ where: { appliedDate: { gte: weekAgo } } }),
    prisma.application.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const [
    usersForGrowth,
    companiesForGrowth,
    jobsForGrowth,
    applicationsForGrowth,
    topJobsRaw,
    recentUsers,
    recentJobs,
    recentApplications,
    roleGroups,
    industryGroups,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo }, role: { not: SUPER_ADMIN_ROLE } },
      select: { createdAt: true },
    }),
    prisma.company.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.job.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
    prisma.application.findMany({
      where: { appliedDate: { gte: sixMonthsAgo } },
      select: { appliedDate: true },
    }),
    prisma.job.findMany({
      select: {
        id: true,
        title: true,
        company: { select: { companyName: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { applications: { _count: "desc" } },
      take: 5,
    }),
    prisma.user.findMany({
      where: { role: { not: SUPER_ADMIN_ROLE } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        company: { select: { companyName: true } },
      },
    }),
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        company: { select: { companyName: true } },
      },
    }),
    prisma.application.findMany({
      orderBy: { appliedDate: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        appliedDate: true,
        user: { select: { name: true } },
        job: { select: { title: true } },
      },
    }),
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.company.groupBy({
      by: ["industry"],
      _count: { _all: true },
    }),
  ]);

  const userMonthCounts = countByMonth(usersForGrowth, "createdAt");
  const companyMonthCounts = countByMonth(companiesForGrowth, "createdAt");
  const jobMonthCounts = countByMonth(jobsForGrowth, "createdAt");
  const applicationMonthCounts = countByMonth(
    applicationsForGrowth.map((row) => ({ createdAt: row.appliedDate })),
    "createdAt",
  );

  const growthByMonth = monthKeys.map((key) => ({
    month: monthLabel(key),
    users: userMonthCounts[key] || 0,
    companies: companyMonthCounts[key] || 0,
    jobs: jobMonthCounts[key] || 0,
    applications: applicationMonthCounts[key] || 0,
  }));

  const applicationFunnel = {
    pending: 0,
    reviewed: 0,
    accepted: 0,
    rejected: 0,
    spam: 0,
  };
  applicationGroups.forEach((group) => {
    if (group.status in applicationFunnel) {
      applicationFunnel[group.status] = group._count._all;
    }
  });

  const jobsWithApps = await prisma.job.findMany({
    select: {
      companyId: true,
      company: { select: { companyName: true } },
      _count: { select: { applications: true } },
    },
  });

  const companyAppMap = new Map();
  jobsWithApps.forEach((job) => {
    const existing = companyAppMap.get(job.companyId) || {
      companyName: job.company.companyName,
      applicationCount: 0,
      jobCount: 0,
    };
    existing.applicationCount += job._count.applications;
    existing.jobCount += 1;
    companyAppMap.set(job.companyId, existing);
  });

  const topCompanies = [...companyAppMap.values()]
    .sort((a, b) => b.applicationCount - a.applicationCount)
    .slice(0, 5);

  const topJobs = topJobsRaw.map((job) => ({
    title: job.title,
    companyName: job.company.companyName,
    applicationCount: job._count.applications,
  }));

  const activity = [
    ...recentUsers.map((user) => ({
      type: "user_registered",
      title: user.name,
      subtitle: user.email,
      meta: user.role,
      at: user.createdAt,
    })),
    ...recentJobs.map((job) => ({
      type: "job_posted",
      title: job.title,
      subtitle: job.company.companyName,
      meta: job.status,
      at: job.createdAt,
    })),
    ...recentApplications.map((app) => ({
      type: "application_submitted",
      title: app.user.name,
      subtitle: app.job.title,
      meta: app.status,
      at: app.appliedDate,
    })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 10);

  const needsAction =
    unverifiedCompanies +
    suspendedUsers +
    suspendedCompanies +
    warnedUsers +
    warnedCompanies;

  const roleBreakdown = {
    job_seeker: 0,
    company_admin: 0,
    super_admin: 0,
  };
  roleGroups.forEach((group) => {
    if (group.role in roleBreakdown) {
      roleBreakdown[group.role] = group._count._all;
    }
  });

  const industryBreakdown = industryGroups
    .map((group) => ({
      industry: group.industry || "Other",
      count: group._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  return {
    ...totals,
    openJobs,
    closedJobs,
    verifiedCompanies,
    unverifiedCompanies,
    suspendedUsers,
    suspendedCompanies,
    warnedUsers,
    warnedCompanies,
    newUsersThisWeek,
    newJobsThisWeek,
    newApplicationsThisWeek,
    needsAction,
    applicationFunnel,
    growthByMonth,
    topCompanies,
    topJobs,
    recentActivity: activity,
    recentUsers,
    roleBreakdown,
    industryBreakdown,
  };
};

export { getGlobalStatsService, getAdminDashboardService };