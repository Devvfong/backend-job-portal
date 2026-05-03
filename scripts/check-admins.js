import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'company_admin' },
    select: { email: true },
    take: 5
  });
  console.log("Company Admin Emails:", users.map(u => u.email));
}

main().catch(console.error).finally(() => prisma.$disconnect());
