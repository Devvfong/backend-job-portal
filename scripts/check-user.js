import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const email = "devqii@gmail.com";
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, name: true }
  });
  
  if (user) {
    console.log("✅ User found:", user);
  } else {
    console.log("❌ User not found in database.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
