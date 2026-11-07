/*
  Warnings:

  - You are about to drop the `alert_pref` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "alert_pref" DROP CONSTRAINT "alert_pref_userId_fkey";

-- DropIndex
DROP INDEX "reddit_thread_projectId_channel_isDone_redditCreatedAt_idx";

-- AlterTable
ALTER TABLE "reddit_thread" ADD COLUMN     "dismissedAt" TIMESTAMP(3),
ADD COLUMN     "isDismissed" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "alert_pref";

-- CreateTable
CREATE TABLE "AlertPref" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyInbounds" BOOLEAN NOT NULL DEFAULT true,
    "notifyOutbound" BOOLEAN NOT NULL DEFAULT true,
    "channels" TEXT[],
    "discordEnabled" BOOLEAN NOT NULL DEFAULT false,
    "discordWebhookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertPref_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlertPref_userId_key" ON "AlertPref"("userId");

-- CreateIndex
CREATE INDEX "reddit_thread_projectId_channel_isDone_isDismissed_redditCr_idx" ON "reddit_thread"("projectId", "channel", "isDone", "isDismissed", "redditCreatedAt");

-- AddForeignKey
ALTER TABLE "AlertPref" ADD CONSTRAINT "AlertPref_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
