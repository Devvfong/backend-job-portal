import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const logoToken = process.env.LOGO_DEV_TOKEN || "YOUR_API_KEY";

const getCompanyDomain = (company) => {
    if (company.website) {
        try {
            return new URL(company.website).hostname.replace(/^www\./, "");
        } catch {
            // fall through to email parsing
        }
    }

    if (company.email?.includes("@")) {
        return company.email.split("@")[1].toLowerCase();
    }

    return null;
};

async function main() {
    const companies = await prisma.company.findMany({
        select: {
            id: true,
            companyName: true,
            email: true,
            logo: true,
            website: true,
        },
        orderBy: {
            companyName: "asc",
        },
    });

    const result = companies.map((company) => {
        const domain = getCompanyDomain(company);

        return {
            id: company.id,
            companyName: company.companyName,
            email: company.email,
            website: company.website,
            logo: company.logo || (domain ? `https://img.logo.dev/${domain}?token=${logoToken}` : null),
            logoFallback: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
        };
    });

    console.log(JSON.stringify(result, null, 2));
}

main()
    .catch((error) => {
        console.error("Failed to query companies:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });