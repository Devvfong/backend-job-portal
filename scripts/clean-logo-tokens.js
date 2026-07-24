import { PrismaClient } from "@prisma/client";
import { URL } from "url";

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    where: {
      logo: {
        contains: "token=",
      },
    },
  });

  console.log(`Found ${companies.length} companies with token in logo URL.`);

  for (const company of companies) {
    try {
      const parsed = new URL(company.logo);
      const cleanUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
      await prisma.company.update({
        where: { id: company.id },
        data: { logo: cleanUrl },
      });
      console.log(`Cleaned logo for: ${company.companyName} (${cleanUrl})`);
    } catch (err) {
      console.error(`Failed to clean logo for ${company.companyName}:`, err.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
