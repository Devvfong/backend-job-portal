import { prisma } from "./../config/db.js";
import { deleteFileFromSupabase } from "./upload.service.js";

const createCompanyService = async (data, user) => {
  // Only authenticated users allowed.
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Allow super_admin to create companies.
  if (user.role === "super_admin") {
    // ok
  } else if (user.role === "company_admin") {
    // company_admin may create a company only if not already linked to one
    if (user.companyId) {
      throw new Error("User is already linked to a company");
    }
  } else {
    throw new Error("Unauthorized");
  }

  const companyName = data.companyName?.trim(); // Trim whitespace from companyName
  const email = data.email?.trim().toLowerCase();
  // Basic validation to ensure required fields are provided and not just whitespace
  if (!companyName || companyName === "") {
    throw new Error("companyName is required");
  }

  if (!email || email === "") {
    throw new Error("email is required");
  }

  const existingCompany = await prisma.company.findUnique({
    where: { email },
  });

  if (existingCompany) {
    throw new Error("Company already exists");
  }

  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        companyName,
        email,
        description: data.description ?? null,
        website: data.website ?? null,
        location: data.location ?? null,
        logo: data.logo ?? null,
        industry: data.industry ?? null,
        size: data.size ?? null,
      },
    });

    // Automatically link the admin to the created company
    await tx.user.update({
      where: { id: user.id },
      data: { companyId: company.id },
    });

    return company;
  });
};

const getCompanyService = async (query = {}) => {
  const {
    search,
    companyName,
    location,
    industry,
    size,
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "desc",
  } = query;

  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * limitNumber;

  const where = {};

  if (search) {
    const text = String(search);
    where.OR = [
      { companyName: { contains: text, mode: "insensitive" } },
      { location: { contains: text, mode: "insensitive" } },
      { industry: { contains: text, mode: "insensitive" } },
      { description: { contains: text, mode: "insensitive" } },
    ];
  }

  if (companyName) {
    where.companyName = {
      contains: String(companyName),
      mode: "insensitive",
    };
  }

  if (location) {
    where.location = {
      contains: String(location),
      mode: "insensitive",
    };
  }

  if (industry) {
    where.industry = {
      contains: String(industry),
      mode: "insensitive",
    };
  }

  if (size) {
    where.size = String(size);
  }

  const allowedSortFields = ["createdAt", "companyName", "location", "industry"];
  const sortField = allowedSortFields.includes(sort) ? sort : "createdAt";
  const sortOrder = order === "asc" ? "asc" : "desc"; // Default to descending order

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: {
        [sortField]: sortOrder,
      },
      skip,
      take: limitNumber,
    }),
    prisma.company.count({ where }),
  ]);

  return {
    companies,
    meta: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
      sort: sortField,
      order: sortOrder,
    },
  };
};
const getCompanyServiceById = async (id) => {
  return prisma.company.findUnique({
    where: { id },
    include: {
      jobs: {
        where: { status: "open" },
        select: {
          id: true,
          status: true,
          title: true,
          location: true,
          jobType: true,
          description: true,
          requirements: true,
          benefits: true,
          salaryMin: true,
          salaryMax: true,
          createdAt: true,
        },
      },
    },
  });
};
const updateCompanyService = async (id, data, user) => {
  // Verify permissions: super_admin bypass or company ownership
  const isSuperAdmin = user?.role === 'super_admin';
  const isOwnCompanyAdmin = user?.role === 'company_admin' && user.companyId === id;

  if (!isSuperAdmin && !isOwnCompanyAdmin) {
    throw new Error("Unauthorized");
  }
  const company = await prisma.company.findUnique({
    where: { id },
  });

  if (!company) {
    throw new Error("Company not found");
  }
  return prisma.company.update({
    where: { id },
    data,
  });
};

const deleteCompanyService = async (id, user) => {
  // Verify permissions: super_admin bypass or company admin role
  const isSuperAdmin = user?.role === 'super_admin';
  const isCompanyAdmin = user?.role === 'company_admin';

  if (!isSuperAdmin && !isCompanyAdmin) {
    throw new Error("Unauthorized");
  }

  const company = await prisma.company.findUnique({
    where: { id },
  });

  if (!company) {
    throw new Error("Company not found");
  }
  if (company.logo) {
    await deleteFileFromSupabase(company.logo, "logos");
  }
  return prisma.company.delete({
    where: { id },
  });

};

const updateCompanyLogo = async (companyId, logoUrl) => {
  return prisma.company.update({
    where: { id: companyId },
    data: { logo: logoUrl },
  });
};
const deleteCompanyLogo = async (user, companyId) => {
  // Verify permissions: super_admin bypass or company ownership
  const isSuperAdmin = user?.role === 'super_admin';
  const isOwnCompanyAdmin = user?.role === 'company_admin' && user.companyId === companyId;

  if (!isSuperAdmin && !isOwnCompanyAdmin) {
    throw new Error("Unauthorized");
  }
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  if (!company.logo) {
    throw new Error("No logo found");
  }

  if (company.logo) {
    await deleteFileFromSupabase(company.logo, "logos");
  }

  return prisma.company.update({
    where: { id: companyId },
    data: { logo: null },
  });
};

const getCompanyStatsService = async (companyId) => {
  const [totalJobs, totalApplications, statusCounts] = await Promise.all([
    // 1. Total Jobs
    prisma.job.count({
      where: { companyId: Number(companyId) },
    }),

    // 2. Total Applications
    prisma.application.count({
      where: {
        job: { companyId: Number(companyId) },
      },
    }),

    // 3. Status Breakdown
    prisma.application.groupBy({
      by: ["status"],
      where: {
        job: { companyId: Number(companyId) },
      },
      _count: true,
    }),
  ]);

  // Format status counts into a nice object
  const statusSummary = statusCounts.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {});

  return {
    totalJobs,
    totalApplications,
    statusSummary,
  };
};
export {
  createCompanyService,
  getCompanyService,
  getCompanyServiceById,
  updateCompanyService,
  deleteCompanyService,
  updateCompanyLogo,
  deleteCompanyLogo,
  getCompanyStatsService,
};
