import { prisma } from "../config/db.js";

const getGlobalStatsService = async () => {
  const [totalJobs, totalCompanies, totalUsers, totalApplications] = await Promise.all([
    prisma.job.count(),
    prisma.company.count(),
    prisma.user.count(),
    prisma.application.count(),
  ]);

  return {
    totalJobs,
    totalCompanies,
    totalUsers,
    totalApplications,
  };
};

export { getGlobalStatsService };
