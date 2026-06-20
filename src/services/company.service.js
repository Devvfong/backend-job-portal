import { prisma } from "./../config/db.js";
import { deleteFileFromSupabase } from "./upload.service.js";

const logoDevToken = process.env.LOGO_DEV_TOKEN;

const getCompanyDomain = (data) => {
  if (data.website) {
    try {
      return new URL(data.website).hostname.replace(/^www\./, "");
    } catch {
      // fall through to email parsing
    }
  }

  if (data.email?.includes("@")) {
    return data.email.split("@")[1].toLowerCase();
  }

  return null;
};

const getCompanyLogoUrl = (data) => {
  if (data.logo) {
    return data.logo;
  }

  const domain = getCompanyDomain(data);
  if (!domain) {
    return null;
  }

  return `https://img.logo.dev/${domain}?token=${logoDevToken}`;
};

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

  try {
    return await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          companyName,
          email,
          description: data.description ?? null,
          website: data.website ?? null,
          location: data.location ?? null,
          logo: getCompanyLogoUrl({ ...data, email }),
          industry: data.industry ?? null,
          size: data.size ?? null,
        },
      });

      if (user.role === "company_admin") {
        await tx.user.update({
          where: { id: user.id },
          data: { companyId: company.id },
        });
      }

      return company;
    });
  } catch (error) {
    if (error.code === 'P2002' && (error.meta?.target?.includes('email') || error.meta?.target === 'email')) {
      throw new Error("Company already exists");
    }
    throw error;
  }
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
      select: {
        id: true,
        companyName: true,
        logo: true,
        coverImage: true,
        industry: true,
        location: true,
        website: true,
        size: true,
        description: true,
        foundedYear: true,
        officeCount: true,
        gallery: true,
        specialties: true,
        mapUrl: true,
        latitude: true,
        longitude: true,
        createdAt: true,
        isVerified: true,
        isSuspended: true,
        warningCount: true,
        _count: {
          select: { jobs: true }
        }
      },
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
const getCompanyServiceById = async (id, includeSensitive = false) => {
  const select = {
    id: true,
    companyName: true,
    logo: true,
    coverImage: true,
    industry: true,
    location: true,
    website: true,
    size: true,
    description: true,
    foundedYear: true,
    officeCount: true,
    gallery: true,
    specialties: true,
    mapUrl: true,
    latitude: true,
    longitude: true,
    createdAt: true,
    isVerified: true,
    isSuspended: true,
    warningCount: true,
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
  };

  if (includeSensitive) {
    select.email = true;
    select.users = {
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        headline: true,
      },
    };
  }

  return prisma.company.findUnique({
    where: { id },
    select,
  });
};

const getMyCompanyService = async (companyId) => {
  if (!companyId) {
    throw new Error("Company not found");
  }
  // For authenticated users, include sensitive fields like email
  return getCompanyServiceById(Number(companyId), true);
};

const getMyCompanyJobsService = async (companyId) => {
  if (!companyId) {
    throw new Error("Company not found");
  }

  return prisma.job.findMany({
    where: { companyId: Number(companyId) },
    include: {
      company: {
        select: {
          id: true,
          companyName: true,
          logo: true,
          isVerified: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const updateCompanyService = async (id, data, user) => {
  // Verify permissions: super_admin bypass or company ownership
  const isSuperAdmin = user?.role === "super_admin";
  const isOwnCompanyAdmin = user?.role === "company_admin" && user.companyId === id;

  if (!isSuperAdmin && !isOwnCompanyAdmin) {
    throw new Error("Unauthorized");
  }

  const company = await prisma.company.findUnique({
    where: { id },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  if (!isSuperAdmin) {
    const requestedCompanyName = data.companyName?.trim();
    const requestedEmail = data.email?.trim().toLowerCase();
    const isChangingCompanyName =
      requestedCompanyName !== undefined &&
      requestedCompanyName !== company.companyName;
    const isChangingEmail =
      requestedEmail !== undefined &&
      requestedEmail !== company.email;

    if (isChangingCompanyName || isChangingEmail) {
      throw new Error("Company identity changes require super admin approval");
    }

    delete data.companyName;
    delete data.email;
    delete data.isVerified;
  }

  if (data.logo === "logo.dev") {
    data.logo = getCompanyLogoUrl({
      website: data.website !== undefined ? data.website : company.website,
      email: company.email,
    });
  }

  return prisma.company.update({
    where: { id },
    data: {
      ...data,
      gallery: data.gallery ? data.gallery : undefined,
      mapUrl: data.mapUrl !== undefined ? data.mapUrl : undefined,
      latitude: data.latitude !== undefined && data.latitude !== null ? parseFloat(data.latitude) : undefined,
      longitude: data.longitude !== undefined && data.longitude !== null ? parseFloat(data.longitude) : undefined,
    },
  });
};

const deleteCompanyService = async (id, user) => {
  const company = await prisma.company.findUnique({
    where: { id },
  })
  if (!company) {
    throw new Error("Company not found");
  }
  // Verify permissions: super_admin bypass or company admin role
  const isSuperAdmin = user?.role === "super_admin";
  const isOwnCompanyAdmin = user?.role === "company_admin" && user.companyId === id;

  if (!isSuperAdmin && !isOwnCompanyAdmin) {
    throw new Error("Unauthorized");
  }

  if (company.logo) {
    await deleteFileFromSupabase(company.logo, "logos");
  }

  return prisma.company.delete({
    where: { id },
  });
};

const updateCompanyLogo = async (companyId, logoUrl) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (company && company.logo) {
    if (company.logo.includes("supabase.co") && company.logo.includes("logos")) {
      // Extract the path from the URL
      const urlParts = company.logo.split("logos/");
      if (urlParts.length >= 2) {
        const filePath = urlParts[1];
        await prisma.deletedAsset.create({
          data: { filePath, bucket: "logos" },
        });
      }
    }
  }

  return prisma.company.update({
    where: { id: companyId },
    data: { logo: logoUrl },
  });
};

const deleteCompanyLogo = async (user, companyId) => {
  // Verify permissions: super_admin bypass or company ownership
  const isSuperAdmin = user?.role === "super_admin";
  const isOwnCompanyAdmin = user?.role === "company_admin" && user.companyId === companyId;

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

  // Shadow Deletion logic: insert path into deleted_assets instead of immediately deleting
  if (company.logo.includes("supabase.co") && company.logo.includes("logos")) {
    const urlParts = company.logo.split("logos/");
    if (urlParts.length >= 2) {
      const filePath = urlParts[1];
      await prisma.deletedAsset.create({
        data: { filePath, bucket: "logos" },
      });
    }
  }

  return prisma.company.update({
    where: { id: companyId },
    data: { logo: null },
  });
};

const updateCompanyCover = async (companyId, coverUrl) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (company && company.coverImage) {
    if (company.coverImage.includes("supabase.co") && company.coverImage.includes("logos")) {
      const urlParts = company.coverImage.split("logos/");
      if (urlParts.length >= 2) {
        const filePath = urlParts[1];
        await prisma.deletedAsset.create({
          data: { filePath, bucket: "logos" },
        });
      }
    }
  }

  return prisma.company.update({
    where: { id: companyId },
    data: { coverImage: coverUrl },
  });
};

const deleteCompanyCover = async (user, companyId) => {
  const isSuperAdmin = user?.role === "super_admin";
  const isOwnCompanyAdmin = user?.role === "company_admin" && user.companyId === companyId;

  if (!isSuperAdmin && !isOwnCompanyAdmin) {
    throw new Error("Unauthorized");
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  if (!company.coverImage) {
    throw new Error("No cover image found");
  }

  if (company.coverImage.includes("supabase.co") && company.coverImage.includes("logos")) {
    const urlParts = company.coverImage.split("logos/");
    if (urlParts.length >= 2) {
      const filePath = urlParts[1];
      await prisma.deletedAsset.create({
        data: { filePath, bucket: "logos" },
      });
    }
  }

  return prisma.company.update({
    where: { id: companyId },
    data: { coverImage: null },
  });
};

const getCompanyStatsService = async (companyId) => {
  const [totalJobs, activeJobs, totalApplications, statusCounts] = await Promise.all([
    prisma.job.count({ where: { companyId: Number(companyId) } }),
    prisma.job.count({
      where: {
        companyId: Number(companyId),
        status: "open",
      },
    }),
    prisma.application.count({
      where: {
        job: { companyId: Number(companyId) },
      },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: {
        job: { companyId: Number(companyId) },
      },
      _count: true,
    }),
  ]);

  const statusSummary = statusCounts.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {});

  return {
    totalJobs,
    activeJobs,
    totalApplications,
    pendingApplications: statusSummary.pending ?? 0,
    statusSummary,
  };
};

const suspendCompanyService = async (id) => {
  const company = await prisma.company.findUnique({
    where: { id: Number(id) },
  });
  if (!company) {
    throw new Error("Company not found");
  }
  return prisma.company.update({
    where: { id: Number(id) },
    data: { isSuspended: !company.isSuspended },
  });
};

const warnCompanyService = async (id) => {
  const company = await prisma.company.findUnique({
    where: { id: Number(id) },
  });
  if (!company) {
    throw new Error("Company not found");
  }
  return prisma.company.update({
    where: { id: Number(id) },
    data: { warningCount: company.warningCount + 1 },
  });
};

export {
  createCompanyService,
  getCompanyService,
  getCompanyServiceById,
  getMyCompanyService,
  getMyCompanyJobsService,
  updateCompanyService,
  deleteCompanyService,
  updateCompanyLogo,
  deleteCompanyLogo,
  updateCompanyCover,
  deleteCompanyCover,
  getCompanyStatsService,
  suspendCompanyService,
  warnCompanyService,
};
