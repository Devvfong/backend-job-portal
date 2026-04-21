import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting to seed database...");

  // Hash password once to save time
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Clear existing jobs and companies so seed is deterministic
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // 1. Create Companies (full list)
  const companiesData = [
    { name: "Apple Inc.", domain: "apple.com" },
    { name: "Microsoft", domain: "microsoft.com" },
    { name: "Alphabet Inc.", domain: "google.com" },
    { name: "Amazon", domain: "amazon.com" },
    { name: "Meta Platforms", domain: "meta.com" },
    { name: "NVIDIA", domain: "nvidia.com" },
    { name: "Intel", domain: "intel.com" },
    { name: "AMD", domain: "amd.com" },
    { name: "TSMC", domain: "tsmc.com" },
    { name: "Samsung Electronics", domain: "samsung.com" },
    { name: "Oracle", domain: "oracle.com" },
    { name: "Salesforce", domain: "salesforce.com" },
    { name: "SAP", domain: "sap.com" },
    { name: "Adobe", domain: "adobe.com" },
    { name: "Tencent", domain: "tencent.com" },
    { name: "Alibaba Group", domain: "alibaba.com" },
    { name: "ByteDance", domain: "bytedance.com" },
    { name: "Tesla", domain: "tesla.com" },
    { name: "ASML", domain: "asml.com" },
    { name: "Broadcom", domain: "broadcom.com" },
    { name: "General Electric", domain: "ge.com" },
    { name: "Caterpillar", domain: "cat.com" },
    { name: "Siemens", domain: "siemens.com" },
    { name: "Honeywell", domain: "honeywell.com" },
    { name: "3M", domain: "3m.com" },
    { name: "ABB", domain: "abb.com" },
    { name: "RTX Corporation", domain: "rtx.com" },
    { name: "Boeing", domain: "boeing.com" },
    { name: "Airbus", domain: "airbus.com" },
    { name: "Lockheed Martin", domain: "lockheedmartin.com" },
    { name: "Schneider Electric", domain: "se.com" },
    { name: "Emerson Electric", domain: "emerson.com" },
    { name: "Eaton Corporation", domain: "eaton.com" },
    { name: "Hitachi", domain: "hitachi.com" },
    { name: "CATL", domain: "catl.com" },
    { name: "Mitsubishi Heavy Industries", domain: "mhi.com" },
    { name: "Bosch", domain: "bosch.com" },
    { name: "Deere & Company", domain: "deere.com" },
    { name: "Union Pacific Railroad", domain: "up.com" },
    { name: "CSX Corporation", domain: "csx.com" }
  ];

  const createdCompanies = [];
  for (const c of companiesData) {
    try {
      const comp = await prisma.company.create({
        data: {
          companyName: c.name,
          email: `contact@${c.domain}`,
          logo: `https://img.logo.dev/${c.domain}`,
          description: `${c.name} global company.`,
          website: `https://${c.domain}`,
          location: "Global",
          industry: "Technology/Industrial",
          size: "10000+"
        }
      });
      createdCompanies.push(comp);
    } catch (e) {
      // If insertion fails (e.g., unique constraint), try to find existing and continue
      console.error(`Warning: failed to create company ${c.name}:`, e.message || e);
      const existing = await prisma.company.findUnique({ where: { email: `contact@${c.domain}` } });
      if (existing) createdCompanies.push(existing);
    }
  }

  // 2. Create Company Admins
  for (let i = 0; i < createdCompanies.length; i++) {
    const comp = createdCompanies[i];
    const email = `admin@${comp.companyName.toLowerCase().replace(/\s/g, "")} .com`;
    try {
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          name: `${comp.companyName} Admin`,
          email,
          password: hashedPassword,
          role: "company_admin",
          companyId: comp.id
        }
      });
    } catch (e) {
      console.error(`Warning: failed to upsert admin for ${comp.companyName}:`, e.message || e);
    }
  }

  // 3. Create Job Seekers
  const firstNames = ["Sok", "Chan", "Srey", "Tola", "Sovann"];
  const lastNames = ["Keo", "Seng", "Chea", "Lim", "Heng"];
  const users = [];
  for (let i = 0; i < 20; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    users.push({
      name: `${fName} ${lName}`,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@example.com`,
      password: hashedPassword,
      role: "job_seeker",
    });
  }

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  // 4. Create Jobs: generate random jobs for each company
  const jobTitles = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "DevOps Engineer",
    "AI Engineer",
    "QA Engineer",
    "Cloud Engineer",
    "Data Engineer"
  ];

  const jobTypes = ["full_time", "part_time", "contract", "internship", "remote"];

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  for (const comp of createdCompanies) {
    const jobCount = rand(3, 6);
    for (let i = 0; i < jobCount; i++) {
      try {
        await prisma.job.create({
          data: {
            title: jobTitles[Math.floor(Math.random() * jobTitles.length)],
            location: comp.location || "Remote",
            jobType: jobTypes[Math.floor(Math.random() * jobTypes.length)],
            description: "Generated job description.",
            requirements: "Relevant experience required.",
            benefits: "Health insurance, remote work.",
            category: "Software Development",
            salaryMin: rand(70000, 100000),
            salaryMax: rand(110000, 180000),
            status: "open",
            companyId: comp.id
          }
        });
      } catch (e) {
        console.error(`Warning: failed to create job for ${comp.companyName}:`, e.message || e);
      }
    }
  }

  console.log("✅ Successfully seeded database with tech-giant companies, specific jobs, and users!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
