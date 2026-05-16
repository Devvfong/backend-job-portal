import { prisma } from './src/config/db.js';

async function test() {
  try {
    console.log('Testing database connection...');
    const count = await prisma.company.count();
    console.log('Company count:', count);
    const companies = await prisma.company.findMany({ take: 1 });
    console.log('First company:', companies[0]);
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

test();
