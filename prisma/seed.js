import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const logoDevToken = process.env.LOGO_DEV_TOKEN || "YOUR_API_KEY";

const getLogoUrl = (domain) => `https://img.logo.dev/${domain}?token=${logoDevToken}`;

async function main() {
  console.log("🚀 Starting to seed database...");

  // Hash password once to save time
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Clear existing jobs and companies so seed is deterministic
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // 1. Create Companies (global enterprise list)
  const companiesData = [
    { name: "NVIDIA", domain: "nvidia.com" },
    { name: "Microsoft", domain: "microsoft.com" },
    { name: "Google", domain: "google.com" },
    { name: "Amazon", domain: "amazon.com" },
    { name: "Apple", domain: "apple.com" },
    { name: "Meta", domain: "meta.com" },
    { name: "Oracle", domain: "oracle.com" },
    { name: "Salesforce", domain: "salesforce.com" }
  ];

  const createdCompanies = [];
  for (const c of companiesData) {
    try {
      const comp = await prisma.company.create({
        data: {
          companyName: c.name,
          email: `contact@${c.domain}`,
          logo: getLogoUrl(c.domain),
          description: `${c.name} global enterprise technology company.`,
          website: `https://${c.domain}`,
          location: "Global",
          industry: "Technology / Enterprise Software",
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
    const email = `admin@${comp.companyName.toLowerCase().replace(/\s/g, "")}.com`;
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

  // 4. Create Jobs: 18 jobs per company, with 10 IT and 8 non-IT roles
  const itJobTemplates = [
    { title: "Software Engineer", category: "Software Engineering", jobType: "full_time", salaryMin: 90000, salaryMax: 150000, description: "Build and maintain core product systems." },
    { title: "Frontend Engineer", category: "Software Engineering", jobType: "full_time", salaryMin: 85000, salaryMax: 140000, description: "Develop user interfaces and web experiences." },
    { title: "Backend Engineer", category: "Software Engineering", jobType: "full_time", salaryMin: 90000, salaryMax: 155000, description: "Design APIs, services, and data flows." },
    { title: "Cloud Engineer", category: "Infrastructure", jobType: "full_time", salaryMin: 95000, salaryMax: 160000, description: "Manage cloud systems and deployment reliability." },
    { title: "DevOps Engineer", category: "Infrastructure", jobType: "full_time", salaryMin: 95000, salaryMax: 165000, description: "Automate releases and improve platform stability." },
    { title: "Data Engineer", category: "Data", jobType: "full_time", salaryMin: 90000, salaryMax: 155000, description: "Build data pipelines and analytics infrastructure." },
    { title: "Cybersecurity Analyst", category: "Security", jobType: "full_time", salaryMin: 95000, salaryMax: 165000, description: "Protect systems, users, and company data." },
    { title: "QA Engineer", category: "Quality Assurance", jobType: "full_time", salaryMin: 80000, salaryMax: 130000, description: "Test products and improve release quality." },
    { title: "Solutions Architect", category: "Architecture", jobType: "full_time", salaryMin: 115000, salaryMax: 180000, description: "Design scalable enterprise solutions." },
    { title: "IT Support Specialist", category: "Support", jobType: "full_time", salaryMin: 60000, salaryMax: 100000, description: "Support devices, users, and internal systems." }
  ];

  const nonItJobTemplates = [
    { title: "Marketing Manager", category: "Marketing", jobType: "full_time", salaryMin: 70000, salaryMax: 120000, description: "Lead campaigns and brand strategy." },
    { title: "Product Marketing Specialist", category: "Marketing", jobType: "full_time", salaryMin: 65000, salaryMax: 110000, description: "Position products and support launches." },
    { title: "Sales Executive", category: "Sales", jobType: "full_time", salaryMin: 60000, salaryMax: 105000, description: "Grow accounts and drive revenue." },
    { title: "Business Development Manager", category: "Sales", jobType: "full_time", salaryMin: 80000, salaryMax: 135000, description: "Build partnerships and new business opportunities." },
    { title: "HR Business Partner", category: "Human Resources", jobType: "full_time", salaryMin: 75000, salaryMax: 125000, description: "Support teams, hiring, and employee success." },
    { title: "Finance Analyst", category: "Finance", jobType: "full_time", salaryMin: 75000, salaryMax: 130000, description: "Analyze financial performance and planning." },
    { title: "Operations Coordinator", category: "Operations", jobType: "full_time", salaryMin: 55000, salaryMax: 95000, description: "Coordinate daily business operations." },
    { title: "Content Strategist", category: "Marketing", jobType: "contract", salaryMin: 60000, salaryMax: 100000, description: "Create content plans and campaign messaging." }
  ];

  const jobsPerCompany = 18;
  const itJobsPerCompany = 10;
  const nonItJobsPerCompany = 8;

  for (let companyIndex = 0; companyIndex < createdCompanies.length; companyIndex++) {
    const comp = createdCompanies[companyIndex];
    let templateIndex = 0;

    for (let i = 0; i < itJobsPerCompany; i++) {
      const template = itJobTemplates[templateIndex % itJobTemplates.length];
      templateIndex += 1;

      try {
        await prisma.job.create({
          data: {
            title: template.title,
            location: comp.location || "Global",
            jobType: template.jobType,
            description: template.description,
            requirements: "Relevant experience and strong communication skills.",
            benefits: "Competitive salary, growth opportunities, and staff benefits.",
            category: template.category,
            salaryMin: template.salaryMin,
            salaryMax: template.salaryMax,
            status: "open",
            companyId: comp.id
          }
        });
      } catch (e) {
        console.error(`Warning: failed to create job for ${comp.companyName}:`, e.message || e);
      }
    }

    for (let i = 0; i < nonItJobsPerCompany; i++) {
      const template = nonItJobTemplates[i % nonItJobTemplates.length];

      try {
        await prisma.job.create({
          data: {
            title: template.title,
            location: comp.location || "Global",
            jobType: template.jobType,
            description: template.description,
            requirements: "Relevant experience and strong communication skills.",
            benefits: "Competitive salary, growth opportunities, and staff benefits.",
            category: template.category,
            salaryMin: template.salaryMin,
            salaryMax: template.salaryMax,
            status: "open",
            companyId: comp.id
          }
        });
      } catch (e) {
        console.error(`Warning: failed to create job for ${comp.companyName}:`, e.message || e);
      }
    }
  }

  console.log(`✅ Successfully seeded ${createdCompanies.length} global companies with ${jobsPerCompany} jobs each and mixed roles!`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
