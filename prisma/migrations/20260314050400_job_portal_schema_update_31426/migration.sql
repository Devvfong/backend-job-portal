-- CreateEnum
CREATE TYPE "Role" AS ENUM ('job_seeker', 'company_admin');

-- DropIndex
DROP INDEX "Company_email_idx";

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "description" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "requirements" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyId" INTEGER,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'job_seeker';

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
