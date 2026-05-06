import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "devqii@gmail.com";
  const newPassword = "devqii@123";
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  const user = await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  
  console.log("✅ Password reset successfully for:", user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
