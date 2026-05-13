-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "coverImage" TEXT;

-- CreateTable
CREATE TABLE "deleted_assets" (
    "id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deleted_assets_pkey" PRIMARY KEY ("id")
);
