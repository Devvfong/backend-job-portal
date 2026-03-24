import { prisma } from "./../config/db.js";
import { supabase } from "./../lib/supabase.js";

const createCompanyService = async (data, user) => {
  if (!user || user.role !== "company_admin") {
    throw new Error("Unauthorized kdmv ah chkae");
  }

  const companyName = data.companyName?.trim(); // Trim whitespace from companyName
  const email = data.email?.trim().toLowerCase();
  // Basic validation to ensure required fields are provided and not just whitespace
  if (!companyName || companyName === "") {
    throw new Error("companyName is required ah thok theab");
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

  return prisma.company.create({
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
};

const getCompanyService = async (query = {}) => {
  const {
    search,
    companyName,
    location,
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "asc",
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

  const allowedSortFields = ["createdAt", "companyName", "location"];
  const sortField = allowedSortFields.includes(sort) ? sort : "createdAt";
  const sortOrder = order === "desc" ? "desc" : "asc"; // Default to ascending order

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
  if (!user || user.role !== "company_admin" || user.companyId !== id) {
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
  if (!user || user.role !== "company_admin") {
    throw new Error("Unauthorized");
  }

  const company = await prisma.company.findUnique({
    where: { id },
  });

  if (!company) {
    throw new Error("Company not found");
  }
  const urlParts = company.logo.split("/avatars/");
  if (urlParts.length > 1) {
    const filePath = urlParts[1];
    await supabase.storage.from("avatars").remove([filePath]);
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
const deleteCompanyLogo = async (user,companyId) => {
  if (!user || user.role !== "company_admin" || user.companyId !== companyId) {
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

  const urlParts = company.logo.split("/avatars/");
  if (urlParts.length > 1) {
    const filePath = urlParts[1];
    await supabase.storage.from("avatars").remove([filePath]);
  }

  return prisma.company.update({
    where: { id: companyId },
    data: { logo: null },
  });
};
export {
  createCompanyService,
  getCompanyService,
  getCompanyServiceById,
  updateCompanyService,
  deleteCompanyService,
  updateCompanyLogo,
  deleteCompanyLogo,
};
