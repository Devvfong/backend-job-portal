import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt"; // Using bcrypt as per your package.json

const prisma = new PrismaClient();

async function main() {
  const firstNames = [
    "Sok", "Chan", "Srey", "Rath", "Vuthy", "Bopha", "Dara", "Sophal", "Pisey", "Kolab", 
    "Mony", "Tola", "Sovann", "Phirun", "Makara", "Vannak", "Rithy", "Sokha", "Channtha", "Somnang",
    "Narun", "Serey", "Vicheka", "Nary", "Kalyan", "Vanna", "Sothea", "Borith", "Chhay", "Sambo"
  ];
  const lastNames = [
    "Keo", "Seng", "Chea", "Lim", "Heng", "Sam", "Kim", "Meas", "Pech", "Ros", 
    "Nou", "Vuth", "Lon", "Sun", "Mao", "Ouk", "Kang", "Yun", "Khim", "Duong",
    "Phan", "Sorn", "Thon", "Un", "Yim", "Prom", "Rin", "Khuon", "Chum", "Chov"
  ];

  console.log("🚀 Starting to seed 100 users...");

  // Hash password once to save time
  const hashedPassword = await bcrypt.hash("password123", 10);

  const users = [];
  for (let i = 0; i < 100; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${fName} ${lName}`;
    // Using index to ensure email uniqueness
    const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.com`;

    users.push({
      name: fullName,
      email: email,
      password: hashedPassword,
      role: "job_seeker",
    });
  }

  // Use createMany for high-speed insertion
  const result = await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log(`✅ Successfully seeded ${result.count} users into the database!`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
