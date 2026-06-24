-- AlterTable
ALTER TABLE "deleted_assets" ADD COLUMN IF NOT EXISTS "bucket" TEXT NOT NULL DEFAULT 'logos';