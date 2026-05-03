import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'super_admin' },
    select: { email: true }
  });
  console.log("Super Admin Emails:", admins.map(u => u.email));
}

main().catch(console.error).finally(() => prisma.$disconnect());
