import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting to seed database...");

  // Hash password once to save time
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create Companies
  const companiesData = [
    {
      companyName: "Google",
      email: "careers@google.com",
      description: "Our mission is to organize the world's information and make it universally accessible and useful.",
      location: "Mountain View, CA",
      industry: "Technology",
      size: "10,000+",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png"
    },
    {
      companyName: "Microsoft",
      email: "recruiting@microsoft.com",
      description: "Our mission is to empower every person and every organization on the planet to achieve more.",
      location: "Redmond, WA",
      industry: "Technology",
      size: "10,000+",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/1024px-Microsoft_logo.svg.png"
    },
    {
      companyName: "LinkedIn",
      email: "hiring@linkedin.com",
      description: "Connect the world's professionals to make them more productive and successful.",
      location: "Sunnyvale, CA",
      industry: "Internet",
      size: "10,000+",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/1024px-LinkedIn_logo_initials.png"
    },
    {
      companyName: "Apple",
      email: "jobs@apple.com",
      description: "Think different. We bring the best user experience to our customers through innovative hardware, software, and services.",
      location: "Cupertino, CA",
      industry: "Consumer Electronics",
      size: "10,000+",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1024px-Apple_logo_black.svg.png"
    },
    {
      companyName: "Amazon",
      email: "careers@amazon.com",
      description: "Earth's most customer-centric company, where customers can find and discover anything they might want to buy online.",
      location: "Seattle, WA",
      industry: "E-Commerce / Cloud Computing",
      size: "10,000+",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png"
    },
    {
      companyName: "Meta",
      email: "recruiting@meta.com",
      description: "Giving people the power to build community and bring the world closer together.",
      location: "Menlo Park, CA",
      industry: "Social Media / Technology",
      size: "10,000+",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/1024px-Meta_Platforms_Inc._logo.svg.png"
    }
  ];

  const createdCompanies = [];
  for (const comp of companiesData) {
    const existingComp = await prisma.company.findUnique({ where: { email: comp.email } });
    if (existingComp) {
      createdCompanies.push(existingComp);
    } else {
      const newComp = await prisma.company.create({ data: comp });
      createdCompanies.push(newComp);
    }
  }

  // 2. Create Company Admins
  for (let i = 0; i < createdCompanies.length; i++) {
    const comp = createdCompanies[i];
    const email = `admin@${comp.companyName.toLowerCase().replace(/\s/g, "")}.com`;
    
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

  // 4. Create Jobs
  const companyJobsData = {
    Google: [
      { title: "Senior AI Researcher", desc: "Push the boundaries of AI at Google DeepMind.", req: "PhD in Computer Science. 5+ years ML experience.", category: "Software Developer" },
      { title: "Cloud Infrastructure Architect", desc: "Build scalable cloud solutions for enterprise clients.", req: "Expertise in distributed systems and Go/C++.", category: "Software Developer" },
      { title: "Android System Developer", desc: "Develop features for the next generation of Android OS.", req: "Deep knowledge of the Android framework and kernel.", category: "Software Developer" },
      { title: "Search Algorithms Engineer", desc: "Optimize core search indexing algorithms.", req: "Strong background in data structures and performance tuning.", category: "Software Developer" }
    ],
    Microsoft: [
      { title: "Azure Solutions Architect", desc: "Design high-availability cloud enterprise systems.", req: "10+ years experience in C# and Azure ecosystems.", category: "Software Developer" },
      { title: "Windows Kernel Engineer", desc: "Work on core OS concurrency and system internals.", req: "Expert in C/C++ and low-level system programming.", category: "Software Tester" },
      { title: "Xbox Game Developer", desc: "Create immersive experiences for the Xbox platform.", req: "Experience with DirectX and Unreal Engine.", category: "Software Developer" },
      { title: "Office 365 Product Manager", desc: "Lead product strategy for enterprise productivity tools.", req: "MBA or 5+ years in B2B product management.", category: "Project Manager" }
    ],
    LinkedIn: [
      { title: "Social Graph Engineer", desc: "Optimize the connection graph algorithms for millions of users.", req: "Expertise in graph databases and Java.", category: "Software Developer" },
      { title: "Feed Relevance Data Scientist", desc: "Improve the ranking system of the LinkedIn Feed.", req: "Strong background in ML, Python, and PyTorch/TensorFlow.", category: "Software Tester" },
      { title: "B2B Marketing Specialist", desc: "Drive growth for our talent solutions products.", req: "Experience with scale marketing campaigns.", category: "Team Leader" },
      { title: "Growth Product Designer", desc: "Design seamless onboarding and networking experiences.", req: "Portfolio of high-growth consumer/B2B products.", category: "UX Designer" }
    ],
    Apple: [
      { title: "iOS Frameworks Engineer", desc: "Design architectures for future iOS capabilities.", req: "Fluent in Swift, Objective-C, and system design.", category: "Software Developer" },
      { title: "Hardware Design Engineer", desc: "Innovate on the next generation of custom silicon architectures.", req: "Electrical Engineering background with VHDL/Verilog.", category: "Hardware Engineer" },
      { title: "AR/VR Interaction Designer", desc: "Create intuitive experiences for Vision Pro.", req: "Strong portfolio of spatial and 3D design.", category: "UI Designer" },
      { title: "Siri Machine Learning Associate", desc: "Enhance on-device intelligence and natural language processing.", req: "Experience in NLP and embedded ML systems.", category: "Software Developer" }
    ],
    Amazon: [
      { title: "AWS Elastic Compute Developer", desc: "Scale the backbone of cloud computing infrastructure.", req: "Experience building high-throughput distributed systems.", category: "Software Developer" },
      { title: "Supply Chain Operations Manager", desc: "Optimize global delivery networks and fulfillment centers.", req: "5+ years in logistics and operations.", category: "Project Manager" },
      { title: "Prime Video Frontend Engineer", desc: "Build performant streaming interfaces for global audiences.", req: "Expert in React, TypeScript, and video streaming protocols.", category: "Wordpress Developer" }, // loosely mapped
      { title: "Robotics Applied Scientist", desc: "Develop autonomous algorithms for Amazon Robotics.", req: "PhD in Robotics, Computer Vision, or related field.", category: "Software Developer" }
    ],
    Meta: [
      { title: "Reality Labs Hardware Prototyper", desc: "Invent new hardware concepts for the metaverse.", req: "Experience in rapid prototyping, CAD, and electronics.", category: "Graphic Designer" },
      { title: "Instagram Algorithm Engineer", desc: "Refine recommendation discovery.", req: "Background in applied ML and data infrastructure.", category: "Software Developer" },
      { title: "WhatsApp Core Systems Engineer", desc: "Maintain secure and scalable real-time messaging.", req: "Proficiency in Erlang/C++ and network protocols.", category: "Software Tester" },
      { title: "Metaverse Policy Manager", desc: "Shape trust, safety, and governance for virtual worlds.", req: "Experience in tech policy and ethics.", category: "Team Leader" }
    ]
  };

  const jobTypes = ["full_time", "remote", "full_time", "internship"];

  for (const comp of createdCompanies) {
    const specificJobs = companyJobsData[comp.companyName] || [];
    
    for (let i = 0; i < specificJobs.length; i++) {
      const jobInfo = specificJobs[i];
      const type = jobTypes[i % jobTypes.length];
      
      await prisma.job.create({
        data: {
          title: jobInfo.title,
          category: jobInfo.category, // Added explicit UI category mapping
          location: comp.location,
          jobType: type,
          description: jobInfo.desc,
          requirements: jobInfo.req,
          benefits: "Comprehensive health coverage, 401k match, and excellent workplace perks.",
          salaryMin: 120000 + (Math.random() * 40000), // Adjusted for big tech
          salaryMax: 180000 + (Math.random() * 80000), // Adjusted for big tech
          status: "open",
          companyId: comp.id
        }
      });
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
