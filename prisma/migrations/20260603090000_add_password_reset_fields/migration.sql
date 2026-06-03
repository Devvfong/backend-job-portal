ALTER TABLE "User"
ADD COLUMN "resetPasswordToken" TEXT,
ADD COLUMN "resetPasswordExpires" TIMESTAMP(3);

CREATE INDEX "User_resetPasswordToken_idx" ON "User"("resetPasswordToken");
