-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "coverLetter" TEXT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "industry" TEXT,
ADD COLUMN     "size" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "skills" TEXT[];

-- CreateIndex
CREATE INDEX "Job_jobType_idx" ON "Job"("jobType");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");
