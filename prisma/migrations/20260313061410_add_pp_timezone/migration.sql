-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'asia/phnom_penh';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'asia/phnom_penh';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'asia/phnom_penh';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'asia/phnom_penh';
