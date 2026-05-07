import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSync() {
  console.log('--- NEON DATABASE INSPECTION ---');
  try {
    const companies = await prisma.company.findMany({
      take: 10,
      select: {
        id: true,
        companyName: true,
        logo: true,
        email: true
      }
    });

    console.log(`Found ${companies.length} companies.`);
    companies.forEach(c => {
      console.log(`\n[Company]: ${c.companyName}`);
      console.log(`  Logo: ${c.logo || 'NULL'}`);
      
      if (c.logo) {
        if (c.logo.startsWith('http')) {
          console.log('  Status: ✅ ABSOLUTE (Shared)');
        } else {
          console.log('  Status: ⚠️ RELATIVE (Local Only)');
        }
      }
    });

  } catch (error) {
    console.error('Database check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSync();
