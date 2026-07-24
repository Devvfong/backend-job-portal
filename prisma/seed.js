// Unified database seed script for NextHire
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const companiesToSeed = [
  {
    companyName: 'Zando Cambodia',
    email: 'zando.cambodia@gmail.com',
    industry: 'Retail & Fashion',
    description: 'ZANDO is the leading fashion retail brand in Cambodia, offering high-quality clothing and accessories.',
    location: 'Phnom Penh, Cambodia',
    website: 'https://zandokh.com/index',
    size: '100-500 employees',
    foundedYear: 2011,
    officeCount: 8,
    specialties: ['Retail', 'Fashion', 'Apparel', 'Customer Service'],
    jobs: [
      {
        title: 'Fashion Store Manager',
        location: 'Phnom Penh (Boeung Keng Kang)',
        description: 'We are seeking an experienced Store Manager to oversee operations, sales, and staff at our flagship BKK branch.',
        jobType: 'full_time',
        salaryMin: 600,
        salaryMax: 1000,
        salaryNegotiable: false,
        category: 'Management',
        requirements: 'At least 3 years of experience in retail store management. Strong leadership and communication skills.',
        benefits: 'Competitive basic salary, performance commissions, annual health bonus, and staff discounts.',
        skills: ['Store Operations', 'Sales Management', 'Leadership', 'Customer Service'],
        tags: ['Retail', 'Store Manager', 'Fashion', 'Phnom Penh']
      },
      {
        title: 'Social Media Content Creator',
        location: 'Phnom Penh (Toul Kork)',
        description: 'Join our marketing team to produce engaging video and photo content for TikTok, Instagram, and Facebook.',
        jobType: 'full_time',
        salaryMin: 450,
        salaryMax: 700,
        salaryNegotiable: true,
        category: 'Marketing',
        requirements: 'Proficiency in CapCut, Canva, and mobile photography/videography. Active presence on fashion social channels.',
        benefits: 'Monthly creative allowance, flexible working hours, and career progression.',
        skills: ['Content Creation', 'CapCut', 'Canva', 'Social Media Marketing'],
        tags: ['Creative', 'Marketing', 'TikTok', 'Fashion']
      }
    ]
  },
  {
    companyName: 'Zara Cambodia',
    email: 'zara.cambodia@gmail.com',
    industry: 'Retail & Fashion',
    description: 'Zara is one of the largest international fashion companies, bringing latest trends directly to Cambodia.',
    location: 'Aeon Mall Mean Chey, Phnom Penh',
    website: 'https://zara.com',
    size: '50-100 employees',
    foundedYear: 2023,
    officeCount: 1,
    specialties: ['High Fashion', 'Supply Chain', 'Global Trends'],
    jobs: [
      {
        title: 'Senior Visual Merchandiser',
        location: 'Phnom Penh (Aeon Mall 3)',
        description: 'Responsible for organizing and displaying new arrivals to align with Zara global visual merchandising standards.',
        jobType: 'full_time',
        salaryMin: 800,
        salaryMax: 1300,
        salaryNegotiable: false,
        category: 'Design',
        requirements: 'Experience working as a visual merchandiser in international fast-fashion brands. Strong eye for design trends.',
        benefits: 'Official training in Barcelona, Spain. Group insurance coverage, retail discounts.',
        skills: ['Visual Merchandising', 'Display Design', 'Fashion Trends', 'Attention to Detail'],
        tags: ['Zara', 'Visual Merchandising', 'Aeon 3', 'Phnom Penh']
      }
    ]
  },
  {
    companyName: 'ABA Bank',
    email: 'aba.bank@gmail.com',
    industry: 'Banking & Finance',
    description: 'ABA Bank is Cambodia\'s leading private financial institution, recognized for digital banking excellence.',
    location: 'Preah Monivong Blvd, Phnom Penh',
    website: 'https://www.ababank.com',
    size: '1000+ employees',
    foundedYear: 1996,
    officeCount: 85,
    specialties: ['Digital Banking', 'Mobile App', 'Financial Services', 'Fintech'],
    jobs: [
      {
        title: 'Senior React Native Developer (Fintech)',
        location: 'Phnom Penh (Head Office)',
        description: 'Help develop and scale new features for the award-winning ABA Mobile App handling millions of transactions daily.',
        jobType: 'full_time',
        salaryMin: 1800,
        salaryMax: 3000,
        salaryNegotiable: true,
        category: 'Technology',
        requirements: '4+ years of React Native developer experience. Strong knowledge of state management and native bridge integration.',
        benefits: 'Thirteenth-month salary, performance bonuses, premium healthcare, and continuous learning funds.',
        skills: ['React Native', 'TypeScript', 'Redux', 'API Integration', 'Mobile Security'],
        tags: ['Fintech', 'React Native', 'Mobile App', 'Developer']
      },
      {
        title: 'Customer Service Specialist',
        location: 'Siem Reap Branch',
        description: 'Provide high-quality banking services and solutions to walk-in clients and VIP foreigners in Siem Reap.',
        jobType: 'full_time',
        salaryMin: 400,
        salaryMax: 650,
        salaryNegotiable: false,
        category: 'Banking',
        requirements: 'Bachelor degree in Finance/Banking or related field. Excellent English communication skills.',
        benefits: 'Performance incentives, pension scheme, and bank uniform provided.',
        skills: ['Banking Operations', 'Customer Service', 'Problem Solving', 'English'],
        tags: ['Banking', 'Customer Service', 'Siem Reap']
      }
    ]
  },
  {
    companyName: 'Acleda Bank',
    email: 'acleda.bank@gmail.com',
    industry: 'Banking & Finance',
    description: 'ACLEDA Bank Plc. is a public limited company, boasting the largest branch network coverage in Cambodia.',
    location: 'Preah Monivong Blvd, Phnom Penh',
    website: 'https://www.acledabank.com.kh',
    size: '1000+ employees',
    foundedYear: 1993,
    officeCount: 260,
    specialties: ['Retail Banking', 'Microfinance', 'Public Listing', 'Commercial Loans'],
    jobs: [
      {
        title: 'Credit Officer',
        location: 'Battambang Province',
        description: 'Manage credit assessments, conduct risk analysis, and disburse loans to commercial and microfinance accounts.',
        jobType: 'full_time',
        salaryMin: 500,
        salaryMax: 850,
        salaryNegotiable: false,
        category: 'Finance',
        requirements: 'At least 2 years in loan processing or credit analysis. Familiarity with the local province and businesses.',
        benefits: 'Monthly travel allowance, performance bonus per active accounts, and healthcare coverage.',
        skills: ['Credit Risk', 'Financial Analysis', 'Communication', 'Loan Disbursal'],
        tags: ['Credit Officer', 'Finance', 'Battambang', 'Loan']
      }
    ]
  },
  {
    companyName: 'Ministry of Commerce Cambodia',
    email: 'ministry.commerce@gmail.com',
    industry: 'Government & Public Administration',
    description: 'The Ministry of Commerce regulates commercial transactions, import/export policies, and trade registration in Cambodia.',
    location: 'Lot 19-61, Russian Blvd, Phnom Penh',
    website: 'https://www.moc.gov.kh',
    size: '500-1000 employees',
    foundedYear: 1993,
    officeCount: 25,
    specialties: ['Trade Policy', 'Company Registration', 'Intellectual Property', 'Public Policy'],
    jobs: [
      {
        title: 'Trade Relations Coordinator',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Coordinate bilateral trade documentation, prepare reports on import/export metrics, and interface with embassies.',
        jobType: 'full_time',
        salaryMin: 450,
        salaryMax: 700,
        salaryNegotiable: false,
        category: 'Public Relations',
        requirements: 'Bachelor in International Relations, Public Policy, or Economics. Fluency in both Khmer and professional English.',
        benefits: 'Government health package, public holiday allowances, official training opportunities.',
        skills: ['Policy Coordination', 'Khmer/English Translation', 'Report Writing', 'Public Administration'],
        tags: ['Government', 'Public Sector', 'Trade', 'Phnom Penh']
      },
      {
        title: 'Business Registration Officer',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Review and approve company registration submissions on the Single Window service, verifying business credentials.',
        jobType: 'full_time',
        salaryMin: 400,
        salaryMax: 600,
        salaryNegotiable: false,
        category: 'Administration',
        requirements: 'Bachelor of Business Administration, Law, or related. Experience in administrative operations or data verification.',
        benefits: 'Government civil service benefits, public holiday allowance, and professional training.',
        skills: ['Business Registry', 'Khmer Law', 'Data Verification', 'Customer Service'],
        tags: ['Government', 'Public Sector', 'Business', 'Phnom Penh']
      },
      {
        title: 'Intellectual Property Examiner',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Evaluate national and international trademark, copyright, and patent applications according to industrial property law.',
        jobType: 'full_time',
        salaryMin: 500,
        salaryMax: 750,
        salaryNegotiable: false,
        category: 'Legal',
        requirements: 'Degree in Law or related. 1-2 years in legal document review or intellectual property management.',
        benefits: 'Government health package, paid sick leave, and international seminar invites.',
        skills: ['IP Law', 'Legal Review', 'Trademark Verification', 'Documentation'],
        tags: ['Government', 'Legal', 'Intellectual Property', 'Phnom Penh']
      },
      {
        title: 'Import-Export Inspector',
        location: 'Sihanoukville Port Branch',
        description: 'Inspect inbound and outbound shipping declarations to verify compliance with national trade regulations and tariffs.',
        jobType: 'full_time',
        salaryMin: 450,
        salaryMax: 650,
        salaryNegotiable: false,
        category: 'Logistics',
        requirements: 'Degree in Customs, Logistics, or Finance. Ability to work at ports and check physical documentation.',
        benefits: 'Port allowance, regional housing allowance, and basic medical benefits.',
        skills: ['Customs Clearance', 'Import/Export Guidelines', 'Attention to Detail', 'Cargo Inspection'],
        tags: ['Customs', 'Government', 'Sihanoukville', 'Logistics']
      },
      {
        title: 'Bilateral Trade Analyst',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Analyze international markets and compile reports regarding regional FTAs, helping negotiate preferential tariffs.',
        jobType: 'full_time',
        salaryMin: 550,
        salaryMax: 900,
        salaryNegotiable: true,
        category: 'Research',
        requirements: 'Master\'s or Bachelor\'s degree in Economics or International Trade. Proficient in statistical analytics.',
        benefits: 'Overseas study trip sponsorships, flexible research schedule, and state health package.',
        skills: ['Economic Modeling', 'FTA Guidelines', 'Data Analysis', 'English Communication'],
        tags: ['Government', 'Economics', 'Trade Policy', 'Phnom Penh']
      }
    ]
  },
  {
    companyName: 'Ministry of Economy and Finance Cambodia',
    email: 'mef.government@gmail.com',
    industry: 'Government & Public Administration',
    description: 'The Ministry of Economy and Finance guide and manage the economy and financial affairs of Cambodia.',
    location: 'Street 92, Sangkat Wat Phnom, Phnom Penh',
    website: 'https://www.mef.gov.kh',
    size: '500-1000 employees',
    foundedYear: 1993,
    officeCount: 30,
    specialties: ['Public Finance', 'Economic Development', 'Tax Administration', 'Budget Planning'],
    jobs: [
      {
        title: 'Tax Policy Consultant',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Formulate, design, and draft new tax policy amendments and regulations to support government development goals.',
        jobType: 'full_time',
        salaryMin: 700,
        salaryMax: 1100,
        salaryNegotiable: true,
        category: 'Finance',
        requirements: 'Bachelor/Master in Taxation, Finance, or Law. 3+ years experience in public sector tax consultancy or policy formulation.',
        benefits: 'National pension program, health insurance package, and professional development support.',
        skills: ['Tax Policy', 'Khmer Tax Law', 'Drafting Legislation', 'Financial Modeling'],
        tags: ['Government', 'MEF', 'Taxation', 'Finance']
      },
      {
        title: 'Senior Budget Analyst',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Evaluate regional and sector budgetary allocations, assess resource optimization, and prepare fiscal reports.',
        jobType: 'full_time',
        salaryMin: 600,
        salaryMax: 950,
        salaryNegotiable: false,
        category: 'Finance',
        requirements: 'Degree in Public Finance, Accounting, or Economics. Minimum 2 years experience in public treasury or budgeting.',
        benefits: 'Government health plan, official travel allowance, and performance incentives.',
        skills: ['Budget Analysis', 'Treasury Systems', 'Accounting Standards', 'Excel Modeling'],
        tags: ['Government', 'MEF', 'Budget', 'Finance']
      },
      {
        title: 'Public Investment Officer',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Manage socioeconomic feasibility evaluations on national public infrastructure projects and oversee project budgets.',
        jobType: 'full_time',
        salaryMin: 500,
        salaryMax: 800,
        salaryNegotiable: false,
        category: 'Project Management',
        requirements: 'Degree in Civil Engineering, Economics, or Project Management. Excellent assessment skills.',
        benefits: 'Civil service medical card, official phone allowance, and regional site-visit packages.',
        skills: ['Project Valuation', 'Feasibility Study', 'Budget Management', 'Cost-Benefit Analysis'],
        tags: ['Infrastructure', 'Government', 'Project Management', 'MEF']
      },
      {
        title: 'Internal Auditor',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Perform operational and compliance audits across sub-national departments to ensure clean financial practices.',
        jobType: 'full_time',
        salaryMin: 450,
        salaryMax: 700,
        salaryNegotiable: false,
        category: 'Audit',
        requirements: 'Degree in Finance, Accounting, or ACCA. High integrity and detailed inspection skills.',
        benefits: 'Annual bonus, comprehensive healthcare, and technical certification courses.',
        skills: ['Financial Auditing', 'Risk Assessment', 'Compliance Check', 'Report Drafting'],
        tags: ['Audit', 'Government', 'MEF', 'Accounting']
      },
      {
        title: 'Economic Data Researcher',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Collect, clean, and analyze macroeconomic datasets to construct models on GDP development and inflation forecasts.',
        jobType: 'full_time',
        salaryMin: 550,
        salaryMax: 850,
        salaryNegotiable: true,
        category: 'Research',
        requirements: 'Bachelor in Econometrics, Statistics, or Applied Mathematics. Experience using SPSS, Stata, or Python.',
        benefits: 'Creative liberty, continuous statistical training, and local government insurance.',
        skills: ['Macroeconomics', 'Statistical Software', 'Data Analysis', 'Predictive Modeling'],
        tags: ['Research', 'Government', 'Econometrics', 'Phnom Penh']
      }
    ]
  },
  {
    companyName: 'Ministry of Education, Youth and Sport Cambodia',
    email: 'moeys.government@gmail.com',
    industry: 'Government & Public Administration',
    description: 'The Ministry of Education, Youth and Sport is responsible for developing educational systems and sports sector in Cambodia.',
    location: '80 Preah Norodom Blvd, Phnom Penh',
    website: 'https://www.moeys.gov.kh',
    size: '500-1000 employees',
    foundedYear: 1993,
    officeCount: 25,
    specialties: ['National Education', 'Youth Development', 'Sports Training', 'Curricula Design'],
    jobs: [
      {
        title: 'Education Policy Analyst',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Review national education standards and recommend policy upgrades to improve regional literacy and STEM metrics.',
        jobType: 'full_time',
        salaryMin: 500,
        salaryMax: 800,
        salaryNegotiable: false,
        category: 'Public Policy',
        requirements: 'Degree in Education Administration, Public Policy, or Social Sciences. 2+ years of educational program review.',
        benefits: 'Civil service coverage, training at international education panels, annual holiday bonuses.',
        skills: ['Policy Formulation', 'STEM Standards', 'Education Assessment', 'Research'],
        tags: ['Education', 'Government', 'MoEYS', 'Policy']
      },
      {
        title: 'National Curricula Developer',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Create and revise textbooks and learning materials for primary and secondary levels in line with STEM reforms.',
        jobType: 'full_time',
        salaryMin: 450,
        salaryMax: 700,
        salaryNegotiable: false,
        category: 'Education',
        requirements: 'Degree in Pedagogy or subject majors (Math, Physics, Khmer). Teaching experience is a plus.',
        benefits: 'Government health program, material publishing credits, and research grants.',
        skills: ['Curriculum Design', 'Pedagogy', 'STEM Content', 'Drafting Textbooks'],
        tags: ['Education', 'Government', 'MoEYS', 'STEM']
      },
      {
        title: 'ICT in Education Specialist',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Design and deploy electronic learning platforms and computer labs for rural schools across provinces.',
        jobType: 'full_time',
        salaryMin: 600,
        salaryMax: 1000,
        salaryNegotiable: true,
        category: 'Technology',
        requirements: 'Degree in IT, Educational Technology, or computer science. Passion for bridging the digital divide.',
        benefits: 'Travel allowance, technical training programs, and medical checkup plans.',
        skills: ['E-Learning Platforms', 'Network Deployment', 'IT Training', 'Project Delivery'],
        tags: ['Technology', 'Education', 'Government', 'MoEYS']
      },
      {
        title: 'Youth Development Coordinator',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Coordinate national youth leadership programs, community service forums, and international student exchange projects.',
        jobType: 'full_time',
        salaryMin: 400,
        salaryMax: 600,
        salaryNegotiable: false,
        category: 'Project Management',
        requirements: 'Experience in youth workshop coordination, NGO operations, or event organization. High energy.',
        benefits: 'Civil service benefits, leadership seminar entry, and project-based rewards.',
        skills: ['Workshop Facilitation', 'Leadership Coaching', 'Event Coordination', 'Khmer/English'],
        tags: ['Youth', 'Government', 'Community', 'MoEYS']
      },
      {
        title: 'Physical Education Advisor',
        location: 'Phnom Penh (Olympic Stadium Office)',
        description: 'Design national primary physical education frameworks and coordinate school sports events and athletic meets.',
        jobType: 'full_time',
        salaryMin: 400,
        salaryMax: 650,
        salaryNegotiable: false,
        category: 'Sports',
        requirements: 'Degree in Sports Science, Physical Education, or experience as a professional athletic coach/trainer.',
        benefits: 'Stadium facility access, sports program funding, and government medical insurance.',
        skills: ['PE Curricula', 'Athletic Coaching', 'Event Management', 'First Aid'],
        tags: ['Sports', 'Government', 'Physical Education', 'MoEYS']
      }
    ]
  },
  {
    companyName: 'Ministry of Post and Telecommunications Cambodia',
    email: 'mptc.government@gmail.com',
    industry: 'Government & Public Administration',
    description: 'The Ministry of Post and Telecommunications oversees the development of postal, telecommunications, and ICT sectors in Cambodia.',
    location: '13 Preah Norodom Blvd, Phnom Penh',
    website: 'https://www.mptc.gov.kh',
    size: '500-1000 employees',
    foundedYear: 1993,
    officeCount: 15,
    specialties: ['Telecommunications', 'Postal Services', 'Digital Governance', 'Cybersecurity'],
    jobs: [
      {
        title: 'Telecommunication Network Analyst',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Analyze and monitor national telecommunications infrastructure, verify coverage standards, and prepare development proposals.',
        jobType: 'full_time',
        salaryMin: 600,
        salaryMax: 1000,
        salaryNegotiable: true,
        category: 'Technology',
        requirements: 'Degree in Telecommunication Engineering, Network Engineering, or related. Experience with telecom infrastructure assessment.',
        benefits: 'Government health plan, official phone/data allowance, and continuous technical training.',
        skills: ['Telecom Networks', 'Infrastructure Audit', 'Kh/Eng Translation', 'Report Writing'],
        tags: ['Telecom', 'Government', 'MPTC', 'Phnom Penh']
      },
      {
        title: 'Cybersecurity Analyst (Remote Support)',
        location: 'Phnom Penh / Remote',
        description: 'Provide remote incident response, monitor government network security, and coordinate threat mitigations.',
        jobType: 'remote',
        salaryMin: 700,
        salaryMax: 1200,
        salaryNegotiable: true,
        category: 'Security',
        requirements: 'Degree in Cybersecurity, Computer Science, or related. Certifications like CEH or CompTIA Security+ preferred.',
        benefits: 'Work from home equipment allowance, premium health insurance, and cyber threat seminar invites.',
        skills: ['Network Security', 'Incident Response', 'Vulnerability Assessment', 'Threat Mitigation'],
        tags: ['Security', 'Government', 'Cyber', 'Remote']
      },
      {
        title: 'Digital Government Specialist',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Support the migration of government services to digital platforms and coordinate national digital identity project integrations.',
        jobType: 'contract',
        salaryMin: 800,
        salaryMax: 1400,
        salaryNegotiable: true,
        category: 'Project Management',
        requirements: 'Degree in Management Information Systems, IT, or related. Minimum 3 years experience with public sector IT modernization.',
        benefits: 'Contract completion bonus, travel allowance for agency visits, and official training sponsors.',
        skills: ['System Integration', 'API Platforms', 'Digital Identity', 'Project Delivery'],
        tags: ['Digital Gov', 'Government', 'IT', 'Contract']
      },
      {
        title: 'Postal Operations Intern',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Assist in inspecting private postal operators and processing document submissions for license applications.',
        jobType: 'internship',
        salaryMin: 150,
        salaryMax: 250,
        salaryNegotiable: false,
        category: 'Administration',
        requirements: 'Current student or recent graduate in Public Administration, Business, or Law. Basic computer skills.',
        benefits: 'Internship certificate, stipend, monthly transport allowance, and public holiday bonuses.',
        skills: ['Administrative Support', 'Data Entry', 'Customer Service', 'Documentation'],
        tags: ['Postal', 'Government', 'Internship', 'MPTC']
      },
      {
        title: 'ICT Regulatory Advisor',
        location: 'Phnom Penh (Ministry HQ)',
        description: 'Draft regulatory frameworks and licensing conditions for internet service providers (ISPs) and mobile network operators.',
        jobType: 'part_time',
        salaryMin: 400,
        salaryMax: 700,
        salaryNegotiable: true,
        category: 'Legal',
        requirements: 'Degree in Law, Public Policy, or Telecommunications Law. Strong understanding of local ICT regulations.',
        benefits: 'Pro-rated civil service health package, flexible working hours, and seminar invites.',
        skills: ['Telecom Policy', 'Legal Drafting', 'ISP Regulations', 'Khmer/English Law'],
        tags: ['Government', 'Policy', 'Telecom Law', 'Part Time']
      }
    ]
  },
  {
    companyName: 'Hanuman Beverages',
    email: 'hanuman.beverages@gmail.com',
    industry: 'Food & Beverages',
    description: 'Hanuman Beverages is a premier Cambodian beverage producer dedicated to international quality standards and brewing excellence.',
    location: 'National Road 4, Phnom Penh',
    website: 'https://hanumanbeverages.com',
    size: '500-1000 employees',
    foundedYear: 2020,
    officeCount: 3,
    specialties: ['Beverage Production', 'Quality Brewing', 'Brand Marketing', 'Supply Chain'],
    jobs: [
      {
        title: 'Brewery Production Manager',
        location: 'Phnom Penh (National Road 4 Factory)',
        description: 'Manage and optimize daily brewing and packaging lines, ensuring adherence to quality and safety regulations.',
        jobType: 'full_time',
        salaryMin: 1200,
        salaryMax: 2000,
        salaryNegotiable: true,
        category: 'Management',
        requirements: 'Degree in Chemical Engineering, Biotechnology, or Food Science. 5+ years experience in large-scale brewery production.',
        benefits: 'Competitive basic salary, performance bonus, private healthcare, and factory meals.',
        skills: ['Brewery Operations', 'Production Planning', 'ISO Standards', 'Team Leadership'],
        tags: ['Brewery', 'Factory', 'Manager', 'Phnom Penh']
      },
      {
        title: 'Quality Assurance Inspector',
        location: 'Phnom Penh (Factory Laboratory)',
        description: 'Conduct chemical and microbiological checks on raw materials, wort, and finished products to maintain taste and quality.',
        jobType: 'contract',
        salaryMin: 600,
        salaryMax: 950,
        salaryNegotiable: false,
        category: 'Science',
        requirements: 'Degree in Chemistry, Food Technology, or Microbiology. Experience in lab testing procedures and QC tools.',
        benefits: 'Thirteenth-month salary, uniform, transportation, and health insurance.',
        skills: ['Laboratory Testing', 'Quality Control', 'Food Safety', 'Data Logging'],
        tags: ['QA', 'QC', 'Laboratory', 'Beverage']
      },
      {
        title: 'Brand Marketing Consultant',
        location: 'Phnom Penh / Remote',
        description: 'Plan, coordinate, and execute marketing campaigns, brand events, and trade sponsorships for Hanuman products.',
        jobType: 'remote',
        salaryMin: 500,
        salaryMax: 900,
        salaryNegotiable: true,
        category: 'Marketing',
        requirements: 'Degree in Marketing, Communications, or Business. 2+ years experience in FMCG marketing or brand coordination.',
        benefits: 'Entertainment budget, mobile allowance, health coverage, and employee product allocations.',
        skills: ['Brand Management', 'Event Coordination', 'FMCG Marketing', 'Creative Campaigning'],
        tags: ['Marketing', 'FMCG', 'Remote', 'Brand']
      },
      {
        title: 'Supply Chain Intern',
        location: 'Phnom Penh (Head Office)',
        description: 'Assist the procurement team in tracking orders, verifying inventory records, and preparing shipping reports.',
        jobType: 'internship',
        salaryMin: 150,
        salaryMax: 250,
        salaryNegotiable: false,
        category: 'Logistics',
        requirements: 'Current student in Supply Chain, Logistics, or Business Administration. Proficient in Excel.',
        benefits: 'Stipend, free factory lunches, certificate of completion, and future employment prospects.',
        skills: ['Data Entry', 'Inventory Tracking', 'Excel', 'Liaison'],
        tags: ['Logistics', 'Supply Chain', 'Internship', 'FMCG']
      },
      {
        title: 'Retail Sales Representative',
        location: 'Siem Reap & Kampong Thom',
        description: 'Acquire and manage relationships with local distributors, restaurants, and retail outlets to hit sales targets.',
        jobType: 'part_time',
        salaryMin: 250,
        salaryMax: 450,
        salaryNegotiable: false,
        category: 'Sales',
        requirements: 'Experience in FMCG or beverage sales. Strong communication and negotiation skills. Own transport required.',
        benefits: 'Pro-rated basic salary + commission rates, fuel allowance, phone allowance, and accident insurance.',
        skills: ['Sales Negotiation', 'Account Management', 'Route Planning', 'FMCG Sales'],
        tags: ['Sales', 'Siem Reap', 'FMCG', 'Part Time']
      }
    ]
  },
  {
    companyName: 'KOI Thé Cambodia',
    email: 'careers@koithe.com.kh',
    industry: 'Food & Beverage',
    description: 'Famous premium bubble tea brand from Taiwan, bringing top-quality tea beverages and signature golden bubbles to Cambodian tea lovers.',
    location: 'Phnom Penh',
    website: 'https://www.koithe.com',
    size: '100-500 employees',
    foundedYear: 2006,
    officeCount: 25,
    specialties: ['Bubble Tea', 'Macchiato', 'Premium Tea', 'Golden Bubbles'],
    jobs: [
      {
        title: 'Part-time Barista',
        location: 'Phnom Penh',
        description: 'Join our dynamic team to prepare premium tea beverages and deliver exceptional customer service to tea lovers.',
        jobType: 'part_time',
        salaryMin: 180,
        salaryMax: 250,
        salaryNegotiable: false,
        category: 'Customer Service',
        requirements: 'Friendly personality, active listening skills, high school student or university student, willingness to learn beverage preparation.',
        benefits: 'Free daily drinks, uniform provided, store sales commissions, flexible shifts.',
        skills: ['Customer Service', 'Food Safety', 'Beverage Preparation', 'Active Listening'],
        tags: ['Barista', 'Part-time', 'Students', 'KOI']
      },
      {
        title: 'Store Supervisor',
        location: 'Phnom Penh',
        description: 'Responsible for managing daily store operations, shift scheduling, inventory control, and guiding baristas in beverage quality.',
        jobType: 'full_time',
        salaryMin: 500,
        salaryMax: 800,
        salaryNegotiable: false,
        category: 'Management',
        requirements: 'At least 1-2 years of supervisor experience in F&B, strong leadership skills, problem-solving ability, and inventory tracking knowledge.',
        benefits: 'Full health insurance, annual performance bonus, store target commissions, training program.',
        skills: ['Leadership', 'Inventory Management', 'Staff Scheduling', 'Sales Analysis'],
        tags: ['Supervisor', 'Management', 'F&B', 'KOI']
      }
    ]
  },
  {
    companyName: 'TUBE Coffee',
    email: 'recruitment@tubecoffee.com.kh',
    industry: 'Food & Beverage',
    description: 'Proudly local Cambodian coffee chain offering fast, affordable, and high-quality local coffee to busy professionals and students.',
    location: 'Phnom Penh',
    website: 'https://www.tubecoffee.com.kh',
    size: '100-300 employees',
    foundedYear: 2017,
    officeCount: 30,
    specialties: ['Local Coffee', 'TUBE Premium Lattee', 'Quick Service', 'Cambodian Espresso'],
    jobs: [
      {
        title: 'Store Cashier & Barista',
        location: 'Phnom Penh',
        description: 'Warmly welcome customers, handle order checkout transactions using POS, and brew quality local coffee beverages.',
        jobType: 'part_time',
        salaryMin: 150,
        salaryMax: 220,
        salaryNegotiable: false,
        category: 'Customer Service',
        requirements: 'Honest, reliable, good math skills for cash registers, friendly speaking manner, neat appearance.',
        benefits: 'Flexible hours, training certificate, daily staff drinks, performance allowance.',
        skills: ['POS Systems', 'Cash Handling', 'Coffee Brewing', 'Basic Math'],
        tags: ['Cashier', 'Barista', 'TUBE', 'Coffee']
      }
    ]
  },
  {
    companyName: 'Starbucks Cambodia',
    email: 'jobs@starbucks.com.kh',
    industry: 'Food & Beverage',
    description: 'Global coffeehouse chain providing premium arabica coffee, artisanal espresso, food pairings, and the signature \'Third Place\' experience.',
    location: 'Phnom Penh',
    website: 'https://www.starbucks.com.kh',
    size: '500-1000 employees',
    foundedYear: 1971,
    officeCount: 20,
    specialties: ['Arabica Coffee', 'Third Place', 'Cold Brew', 'Global Branding'],
    jobs: [
      {
        title: 'Store Shift Supervisor',
        location: 'Phnom Penh',
        description: 'Directs store operations during assigned shifts. Deploys partners, delegates tasks, and ensures customers receive signature Starbucks service.',
        jobType: 'full_time',
        salaryMin: 400,
        salaryMax: 600,
        salaryNegotiable: false,
        category: 'Customer Service',
        requirements: 'Previous experience in hospitality or customer service leadership, intermediate English, strong coordination skills.',
        benefits: 'Global career growth pathways, health insurance, free coffee bags monthly, discount code on all merchandise.',
        skills: ['Team Coordination', 'Customer Relations', 'Quality Control', 'Cash Reconciliation'],
        tags: ['Supervisor', 'Starbucks', 'Leader', 'F&B']
      }
    ]
  },
  {
    companyName: 'Cellcard (CamGSM)',
    email: 'careers@cellcard.com.kh',
    industry: 'Telecommunications',
    description: 'Cambodia\'s longest-serving telecom operator, delivering advanced 4G/5G mobile services, network coverage, and digital entertainment solutions.',
    location: 'Phnom Penh',
    website: 'https://www.cellcard.com.kh',
    size: '1000+ employees',
    foundedYear: 1996,
    officeCount: 1,
    specialties: ['Mobile Network', '5G Data', 'E-sports', 'Broadband Connectivity'],
    jobs: [
      {
        title: 'Customer Support Executive',
        location: 'Phnom Penh',
        description: 'Assist mobile subscribers with queries regarding package subscriptions, network issues, and billing through calls and chat.',
        jobType: 'full_time',
        salaryMin: 300,
        salaryMax: 450,
        salaryNegotiable: false,
        category: 'Customer Support',
        requirements: 'Excellent communication skills in Khmer and basic English, patient under pressure, problem solving mind.',
        benefits: '13th month salary, performance monthly commission, free phone allowance, healthcare.',
        skills: ['Communication', 'Problem Solving', 'Customer Relationship', 'Troubleshooting'],
        tags: ['Customer Support', 'Call Center', 'Telecom', 'Cellcard']
      },
      {
        title: 'Junior Network Engineer',
        location: 'Phnom Penh',
        description: 'Monitor mobile core network performance, assist in diagnosing routing/switching issues, and perform maintenance upgrades.',
        jobType: 'full_time',
        salaryMin: 550,
        salaryMax: 900,
        salaryNegotiable: false,
        category: 'Information Technology',
        requirements: 'Degree in IT/Telecommunications, understanding of OSI model, CCNA configuration knowledge, basic Linux scripting.',
        benefits: 'Technical certification sponsorship, network equipment lab access, annual bonus, premium insurance.',
        skills: ['TCP/IP', 'Routing & Switching', 'Network Monitoring', 'CCNA'],
        tags: ['Network', 'Engineering', 'IT', 'Cellcard']
      }
    ]
  },
  {
    companyName: 'Smart Axiata',
    email: 'careers@smart.com.kh',
    industry: 'Telecommunications',
    description: 'Leading mobile telecommunications operator in Cambodia, serving over 8 million subscribers with innovative digital lifestyles and data connectivity.',
    location: 'Phnom Penh',
    website: 'https://www.smart.com.kh',
    size: '1000+ employees',
    foundedYear: 2008,
    officeCount: 1,
    specialties: ['Digital Services', 'Smart Music', 'Mobile Wallet', 'Youth Community Empowerment'],
    jobs: [
      {
        title: 'Flutter Mobile Developer',
        location: 'Phnom Penh',
        description: 'Collaborate in an agile team to build and optimize user-facing features on Smart\'s digital lifestyle apps using Flutter.',
        jobType: 'full_time',
        salaryMin: 800,
        salaryMax: 1500,
        salaryNegotiable: false,
        category: 'Software Engineering',
        requirements: '2+ years mobile development experience, strong Dart/Flutter coding skills, state management tools (Bloc/Provider), Git workflows.',
        benefits: 'Remote work options, annual retreat, gadget allowance, learning budgets.',
        skills: ['Dart', 'Flutter', 'REST APIs', 'Git', 'State Management'],
        tags: ['Mobile', 'Flutter', 'App', 'Smart']
      },
      {
        title: 'Social Media Specialist',
        location: 'Phnom Penh',
        description: 'Design and implement social media content strategies to engage the youth demographic across Facebook, TikTok, and Telegram.',
        jobType: 'full_time',
        salaryMin: 400,
        salaryMax: 700,
        salaryNegotiable: false,
        category: 'Marketing',
        requirements: 'Creative mind, copy writing skills in Khmer/English, familiarity with digital ads metrics, basic Canva/Photoshop capabilities.',
        benefits: 'Latest phone model provided, creative workshop budgets, healthcare plans.',
        skills: ['Content Creation', 'SEO', 'Facebook Ads', 'Graphic Design'],
        tags: ['Marketing', 'Social Media', 'Creative', 'Smart']
      }
    ]
  },
  {
    companyName: 'Chip Mong Group',
    email: 'recruitment@chipmong.com',
    industry: 'Conglomerate',
    description: 'One of Cambodia\'s largest conglomerates, operating across construction materials, real estate, beverages, banking, and retail shopping malls.',
    location: 'Phnom Penh',
    website: 'https://www.chipmong.com',
    size: '5000+ employees',
    foundedYear: 1982,
    officeCount: 12,
    specialties: ['Concrete & Cement', 'Real Estate Dev', 'Commercial Malls', 'Chip Mong Commercial Bank'],
    jobs: [
      {
        title: 'Site Construction Engineer',
        location: 'Phnom Penh',
        description: 'Coordinate on-site structural works, read engineering drafts, supervise subcontract labor teams, and ensure safety quality rules are met.',
        jobType: 'full_time',
        salaryMin: 600,
        salaryMax: 1100,
        salaryNegotiable: false,
        category: 'Engineering',
        requirements: 'Degree in Civil Engineering, AutoCAD blueprints proficiency, field experience of at least 2 years.',
        benefits: 'Construction site hazard allowance, helmet/boots provided, annual corporate bonus, health coverage.',
        skills: ['AutoCAD', 'Structural Engineering', 'Site Management', 'Safety Compliance'],
        tags: ['Civil', 'Engineer', "Construction", "Chip Mong"]
      },
      {
        title: 'B2B Sales Executive',
        location: 'Phnom Penh',
        description: 'Engage with contractors and developers to sell Chip Mong construction products, cement bulk orders, and maintain client networks.',
        jobType: 'full_time',
        salaryMin: 350,
        salaryMax: 600,
        salaryNegotiable: false,
        category: 'Sales',
        requirements: 'Strong negotiation skills, outbound sales drive, driving license, and outgoing personality.',
        benefits: 'High sales commission structures, petrol cards, client dinners budget, company phone.',
        skills: ['Negotiation', 'B2B Sales', 'Client Relations', 'Outbound Calls'],
        tags: ['Sales', 'Executive', 'B2B', 'Chip Mong']
      }
    ]
  }
];

async function seed() {
  console.log('--- Starting Seed Script ---');
  
  // Hash the target password
  const targetPassword = 'bdvyg2vytBYU987654';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(targetPassword, salt);
  console.log(`Password hashed successfully: "${targetPassword}" -> "${hashedPassword}"`);

  const logoDevToken = process.env.LOGO_DEV_TOKEN || 'pk_K3e0y6U5RieT1eBwGclSjw';
  const getCompanyLogoUrl = (website, email) => {
    let domain = null;
    if (website) {
      try { domain = new URL(website).hostname.replace(/^www\./, ""); } catch {}
    }
    if (!domain && email?.includes("@")) {
      domain = email.split("@")[1].toLowerCase();
    }
    return domain ? `https://img.logo.dev/${domain}` : null;
  };

  for (const cData of companiesToSeed) {
    const { jobs, ...companyDetails } = cData;
    const logoUrl = getCompanyLogoUrl(companyDetails.website, companyDetails.email);

    console.log(`Processing company: "${companyDetails.companyName}"...`);

    // 1. Create or Update the Company
    const company = await prisma.company.upsert({
      where: { email: companyDetails.email },
      update: {
        companyName: companyDetails.companyName,
        industry: companyDetails.industry,
        description: companyDetails.description,
        location: companyDetails.location,
        website: companyDetails.website,
        size: companyDetails.size,
        foundedYear: companyDetails.foundedYear,
        officeCount: companyDetails.officeCount,
        specialties: companyDetails.specialties,
        logo: logoUrl,
      },
      create: {
        companyName: companyDetails.companyName,
        email: companyDetails.email,
        industry: companyDetails.industry,
        description: companyDetails.description,
        location: companyDetails.location,
        website: companyDetails.website,
        size: companyDetails.size,
        foundedYear: companyDetails.foundedYear,
        officeCount: companyDetails.officeCount,
        specialties: companyDetails.specialties,
        logo: logoUrl,
        gallery: [],
      }
    });

    console.log(`✅ Company created/updated (ID: ${company.id})`);

    // 2. Create or Update the associated User / Admin account
    const userEmail = companyDetails.email;
    const userName = companyDetails.companyName;

    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {
        name: userName,
        password: hashedPassword,
        role: 'company_admin',
        companyId: company.id,
      },
      create: {
        name: userName,
        email: userEmail,
        password: hashedPassword,
        role: 'company_admin',
        companyId: company.id,
        skills: [],
      }
    });

    console.log(`✅ Admin User created/updated (ID: ${user.id}, Email: ${user.email})`);

    // 3. Create mock jobs for this company
    for (const jobData of jobs) {
      // Find if job already exists for this company using title
      const existingJob = await prisma.job.findFirst({
        where: {
          title: jobData.title,
          companyId: company.id,
        }
      });

      if (existingJob) {
        console.log(`   Job "${jobData.title}" already exists. Updating...`);
        await prisma.job.update({
          where: { id: existingJob.id },
          data: {
            location: jobData.location,
            description: jobData.description,
            jobType: jobData.jobType,
            salaryMin: jobData.salaryMin,
            salaryMax: jobData.salaryMax,
            salaryNegotiable: jobData.salaryNegotiable,
            category: jobData.category,
            requirements: jobData.requirements,
            benefits: jobData.benefits,
            skills: jobData.skills,
            tags: jobData.tags,
          }
        });
      } else {
        console.log(`   Creating job "${jobData.title}"...`);
        await prisma.job.create({
          data: {
            title: jobData.title,
            location: jobData.location,
            description: jobData.description,
            jobType: jobData.jobType,
            salaryMin: jobData.salaryMin,
            salaryMax: jobData.salaryMax,
            salaryNegotiable: jobData.salaryNegotiable,
            category: jobData.category,
            requirements: jobData.requirements,
            benefits: jobData.benefits,
            skills: jobData.skills,
            tags: jobData.tags,
            companyId: company.id,
          }
        });
      }
    }
    console.log(`✅ Jobs seeded for "${companyDetails.companyName}"`);
  }

  console.log('--- Seed Script Finished Successfully ---');
}

seed()
  .catch((e) => {
    console.error('💥 Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
