import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const companiesToSeed = [
  {
    companyName: "KOI Thé Cambodia",
    email: "careers@koithe.com.kh",
    description: "Famous premium bubble tea brand from Taiwan, bringing top-quality tea beverages and signature golden bubbles to Cambodian tea lovers.",
    location: "Phnom Penh",
    website: "https://www.koithe.com",
    industry: "Food and Beverage",
    size: "100-500 employees",
    foundedYear: 2006,
    officeCount: 25,
    specialties: ["Bubble Tea", "Macchiato", "Premium Tea", "Golden Bubbles"],
    jobs: [
      {
        title: "Part-time Barista",
        location: "Phnom Penh",
        description: "Join our dynamic team to prepare premium tea beverages and deliver exceptional customer service to tea lovers.",
        jobType: "part_time",
        salaryNegotiable: false,
        salaryMin: 180,
        salaryMax: 250,
        benefits: "Free daily drinks, uniform provided, store sales commissions, flexible shifts.",
        requirements: "Friendly personality, active listening skills, high school student or university student, willingness to learn beverage preparation.",
        category: "Customer Service",
        skills: ["Customer Service", "Food Safety", "Beverage Preparation", "Active Listening"],
        tags: ["Barista", "Part-time", "Students", "KOI"],
      },
      {
        title: "Store Supervisor",
        location: "Phnom Penh",
        description: "Responsible for managing daily store operations, shift scheduling, inventory control, and guiding baristas in beverage quality.",
        jobType: "full_time",
        salaryNegotiable: false,
        salaryMin: 500,
        salaryMax: 800,
        benefits: "Full health insurance, annual performance bonus, store target commissions, training program.",
        requirements: "At least 1-2 years of supervisor experience in F&B, strong leadership skills, problem-solving ability, and inventory tracking knowledge.",
        category: "Management",
        skills: ["Leadership", "Inventory Management", "Staff Scheduling", "Sales Analysis"],
        tags: ["Supervisor", "Management", "F&B", "KOI"],
      }
    ]
  },
  {
    companyName: "TUBE Coffee",
    email: "recruitment@tubecoffee.com.kh",
    description: "Proudly local Cambodian coffee chain offering fast, affordable, and high-quality local coffee to busy professionals and students.",
    location: "Phnom Penh",
    website: "https://www.tubecoffee.com.kh",
    industry: "Food and Beverage",
    size: "100-300 employees",
    foundedYear: 2017,
    officeCount: 30,
    specialties: ["Local Coffee", "TUBE Premium Lattee", "Quick Service", "Cambodian Espresso"],
    jobs: [
      {
        title: "Store Cashier & Barista",
        location: "Phnom Penh",
        description: "Warmly welcome customers, handle order checkout transactions using POS, and brew quality local coffee beverages.",
        jobType: "part_time",
        salaryNegotiable: false,
        salaryMin: 150,
        salaryMax: 220,
        benefits: "Flexible hours, training certificate, daily staff drinks, performance allowance.",
        requirements: "Honest, reliable, good math skills for cash registers, friendly speaking manner, neat appearance.",
        category: "Customer Service",
        skills: ["POS Systems", "Cash Handling", "Coffee Brewing", "Basic Math"],
        tags: ["Cashier", "Barista", "TUBE", "Coffee"],
      }
    ]
  },
  {
    companyName: "Starbucks Cambodia",
    email: "jobs@starbucks.com.kh",
    description: "Global coffeehouse chain providing premium arabica coffee, artisanal espresso, food pairings, and the signature 'Third Place' experience.",
    location: "Phnom Penh",
    website: "https://www.starbucks.com.kh",
    industry: "Food and Beverage",
    size: "500-1000 employees",
    foundedYear: 1971,
    officeCount: 20,
    specialties: ["Arabica Coffee", "Third Place", "Cold Brew", "Global Branding"],
    jobs: [
      {
        title: "Store Shift Supervisor",
        location: "Phnom Penh",
        description: "Directs store operations during assigned shifts. Deploys partners, delegates tasks, and ensures customers receive signature Starbucks service.",
        jobType: "full_time",
        salaryNegotiable: false,
        salaryMin: 400,
        salaryMax: 600,
        benefits: "Global career growth pathways, health insurance, free coffee bags monthly, discount code on all merchandise.",
        requirements: "Previous experience in hospitality or customer service leadership, intermediate English, strong coordination skills.",
        category: "Customer Service",
        skills: ["Team Coordination", "Customer Relations", "Quality Control", "Cash Reconciliation"],
        tags: ["Supervisor", "Starbucks", "Leader", "F&B"],
      }
    ]
  },
  {
    companyName: "Cellcard (CamGSM)",
    email: "careers@cellcard.com.kh",
    description: "Cambodia's longest-serving telecom operator, delivering advanced 4G/5G mobile services, network coverage, and digital entertainment solutions.",
    location: "Phnom Penh",
    website: "https://www.cellcard.com.kh",
    industry: "Telecommunications",
    size: "1000+ employees",
    foundedYear: 1996,
    officeCount: 1,
    specialties: ["Mobile Network", "5G Data", "E-sports", "Broadband Connectivity"],
    jobs: [
      {
        title: "Customer Support Executive",
        location: "Phnom Penh",
        description: "Assist mobile subscribers with queries regarding package subscriptions, network issues, and billing through calls and chat.",
        jobType: "full_time",
        salaryNegotiable: false,
        salaryMin: 300,
        salaryMax: 450,
        benefits: "13th month salary, performance monthly commission, free phone allowance, healthcare.",
        requirements: "Excellent communication skills in Khmer and basic English, patient under pressure, problem solving mind.",
        category: "Customer Support",
        skills: ["Communication", "Problem Solving", "Customer Relationship", "Troubleshooting"],
        tags: ["Customer Support", "Call Center", "Telecom", "Cellcard"],
      },
      {
        title: "Junior Network Engineer",
        location: "Phnom Penh",
        description: "Monitor mobile core network performance, assist in diagnosing routing/switching issues, and perform maintenance upgrades.",
        jobType: "full_time",
        salaryNegotiable: false,
        salaryMin: 550,
        salaryMax: 900,
        benefits: "Technical certification sponsorship, network equipment lab access, annual bonus, premium insurance.",
        requirements: "Degree in IT/Telecommunications, understanding of OSI model, CCNA configuration knowledge, basic Linux scripting.",
        category: "Information Technology",
        skills: ["TCP/IP", "Routing & Switching", "Network Monitoring", "CCNA"],
        tags: ["Network", "Engineering", "IT", "Cellcard"],
      }
    ]
  },
  {
    companyName: "Smart Axiata",
    email: "careers@smart.com.kh",
    description: "Leading mobile telecommunications operator in Cambodia, serving over 8 million subscribers with innovative digital lifestyles and data connectivity.",
    location: "Phnom Penh",
    website: "https://www.smart.com.kh",
    industry: "Telecommunications",
    size: "1000+ employees",
    foundedYear: 2008,
    officeCount: 1,
    specialties: ["Digital Services", "Smart Music", "Mobile Wallet", "Youth Community Empowerment"],
    jobs: [
      {
        title: "Flutter Mobile Developer",
        location: "Phnom Penh",
        description: "Collaborate in an agile team to build and optimize user-facing features on Smart's digital lifestyle apps using Flutter.",
        jobType: "full_time",
        salaryNegotiable: false,
        salaryMin: 800,
        salaryMax: 1500,
        benefits: "Remote work options, annual retreat, gadget allowance, learning budgets.",
        requirements: "2+ years mobile development experience, strong Dart/Flutter coding skills, state management tools (Bloc/Provider), Git workflows.",
        category: "Software Engineering",
        skills: ["Dart", "Flutter", "REST APIs", "Git", "State Management"],
        tags: ["Mobile", "Flutter", "App", "Smart"],
      },
      {
        title: "Social Media Specialist",
        location: "Phnom Penh",
        description: "Design and implement social media content strategies to engage the youth demographic across Facebook, TikTok, and Telegram.",
        jobType: "full_time",
        salaryNegotiable: false,
        salaryMin: 400,
        salaryMax: 700,
        benefits: "Latest phone model provided, creative workshop budgets, healthcare plans.",
        requirements: "Creative mind, copy writing skills in Khmer/English, familiarity with digital ads metrics, basic Canva/Photoshop capabilities.",
        category: "Marketing",
        skills: ["Content Creation", "SEO", "Facebook Ads", "Graphic Design"],
        tags: ["Marketing", "Social Media", "Creative", "Smart"],
      }
    ]
  },
  {
    companyName: "Chip Mong Group",
    email: "recruitment@chipmong.com",
    description: "One of Cambodia's largest conglomerates, operating across construction materials, real estate, beverages, banking, and retail shopping malls.",
    location: "Phnom Penh",
    website: "https://www.chipmong.com",
    industry: "Conglomerate",
    size: "5000+ employees",
    foundedYear: 1982,
    officeCount: 12,
    specialties: ["Concrete & Cement", "Real Estate Dev", "Commercial Malls", "Chip Mong Commercial Bank"],
    jobs: [
      {
        title: "Site Construction Engineer",
        location: "Phnom Penh",
        description: "Coordinate on-site structural works, read engineering drafts, supervise subcontract labor teams, and ensure safety quality rules are met.",
        jobType: "full_time",
        salaryNegotiable: false,
        salaryMin: 600,
        salaryMax: 1100,
        benefits: "Construction site hazard allowance, helmet/boots provided, annual corporate bonus, health coverage.",
        requirements: "Degree in Civil Engineering, AutoCAD blueprints proficiency, field experience of at least 2 years.",
        category: "Engineering",
        skills: ["AutoCAD", "Structural Engineering", "Site Management", "Safety Compliance"],
        tags: ["Civil", "Engineer", "Construction", "Chip Mong"],
      },
      {
        title: "B2B Sales Executive",
        location: "Phnom Penh",
        description: "Engage with contractors and developers to sell Chip Mong construction products, cement bulk orders, and maintain client networks.",
        jobType: "full_time",
        salaryNegotiable: false,
        salaryMin: 350,
        salaryMax: 600,
        benefits: "High sales commission structures, petrol cards, client dinners budget, company phone.",
        requirements: "Strong negotiation skills, outbound sales drive, driving license, and outgoing personality.",
        category: "Sales",
        skills: ["Negotiation", "B2B Sales", "Client Relations", "Outbound Calls"],
        tags: ["Sales", "Executive", "B2B", "Chip Mong"],
      }
    ]
  }
];

async function main() {
  console.log("🌱 Starting database seeding...");

  for (const compData of companiesToSeed) {
    const { jobs, ...companyDetails } = compData;

    // 1. Upsert Company (creates it if it does not exist)
    const company = await prisma.company.upsert({
      where: { email: companyDetails.email },
      update: companyDetails,
      create: companyDetails,
    });

    console.log(`🏢 Seeded company: ${company.companyName} (ID: ${company.id})`);

    // 2. Seed Jobs for this Company
    for (const jobData of jobs) {
      // Check if job with same details already exists under this company
      const existingJob = await prisma.job.findFirst({
        where: {
          companyId: company.id,
          title: jobData.title,
          jobType: jobData.jobType,
        },
      });

      if (!existingJob) {
        await prisma.job.create({
          data: {
            ...jobData,
            companyId: company.id,
          },
        });
        console.log(`  💼 Created job: ${jobData.title}`);
      } else {
        console.log(`  ⚠️ Job already exists: ${jobData.title}`);
      }
    }
  }

  console.log("✅ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
