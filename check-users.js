import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database...");
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
    }
  });
  console.log(`Found ${users.length} users in the database:`);
  console.log(users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
