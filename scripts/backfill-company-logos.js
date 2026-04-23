import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const logoDevToken = process.env.LOGO_DEV_TOKEN || "YOUR_API_KEY";

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

const getLogoUrl = (domain) => `https://img.logo.dev/${domain}?token=${logoDevToken}`;

async function main() {
    const companies = await prisma.company.findMany({
        select: {
            id: true,
            companyName: true,
            email: true,
            website: true,
            logo: true,
        },
    });

    let updatedCount = 0;
    const skipped = [];

    for (const company of companies) {
        const domain = getCompanyDomain(company);

        if (!domain) {
            skipped.push({ id: company.id, companyName: company.companyName, reason: "No website or email domain" });
            continue;
        }

        const nextLogo = getLogoUrl(domain);

        if (company.logo === nextLogo) {
            continue;
        }

        await prisma.company.update({
            where: { id: company.id },
            data: { logo: nextLogo },
        });

        updatedCount += 1;
    }

    console.log(JSON.stringify({ updatedCount, skipped }, null, 2));
}

main()
    .catch((error) => {
        console.error("Failed to backfill company logos:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });