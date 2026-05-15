import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    where: { companyName: { contains: 'Devqii', mode: 'insensitive' } },
    include: { _count: { select: { jobs: true } } }
  });
  console.log('Companies matching Devqii:', JSON.stringify(companies, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
