-- AlterTable
ALTER TABLE "user" ADD COLUMN     "plan" TEXT DEFAULT 'FREE',
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT DEFAULT 'inactive';
