import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@nvidia.com' }
  });
  
  if (!user) {
    console.log("User not found");
    return;
  }
  
  const passwords = ["password123", "devqii@123", "Password123", "password", "nvidia123"];
  for (const pw of passwords) {
    const match = await bcrypt.compare(pw, user.password);
    if (match) {
      console.log(`MATCH FOUND: ${pw}`);
      return;
    }
  }
  console.log("No match found for common passwords");
}

main().catch(console.error).finally(() => prisma.$disconnect());
