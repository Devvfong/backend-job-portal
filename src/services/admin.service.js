import { prisma } from "../config/db.js";

const getModerationLogsService = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.warningLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        issuedBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        targetUser: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        targetCompany: {
          select: { id: true, companyName: true, logo: true },
        },
      },
    }),
    prisma.warningLog.count(),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export { getModerationLogsService };
