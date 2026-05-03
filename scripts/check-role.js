import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'soklanglyy@devqii.me' },
    select: { email: true, role: true }
  });
  console.log("User Role:", user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
