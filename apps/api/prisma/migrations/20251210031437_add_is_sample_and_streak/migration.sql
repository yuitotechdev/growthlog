-- AlterTable: Add isSample column to activities
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "isSample" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: Add index for userId and isSample
CREATE INDEX IF NOT EXISTS "activities_userId_isSample_idx" ON "activities"("userId", "isSample");
