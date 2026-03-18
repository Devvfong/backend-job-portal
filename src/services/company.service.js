import { prisma } from "./../config/db.js";

const createCompanyService = async (data, user) => {
  if (!user) {
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
      companyName, // yg no need validate bcuz validate pi leu hx hx
      email,
      description: data.description ?? null, // Use null if description is not provided
      website: data.website ?? null,
      location: data.location ?? null,
      logo: data.logo ?? null,
      industry: data.industry ?? null,
      size: data.size ?? null,
    },
  });
};

export { createCompanyService };
