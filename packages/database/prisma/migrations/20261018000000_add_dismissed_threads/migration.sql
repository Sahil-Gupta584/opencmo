-- AlterTable
ALTER TABLE "reddit_thread" ADD COLUMN "isDismissed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reddit_thread" ADD COLUMN "dismissedAt" TIMESTAMP(3);

-- CreateIndex
DROP INDEX IF EXISTS "reddit_thread_projectId_channel_isDone_redditCreatedAt_idx";
CREATE INDEX "reddit_thread_projectId_channel_isDone_isDismissed_redditCreatedAt_idx" ON "reddit_thread"("projectId", "channel", "isDone", "isDismissed", "redditCreatedAt");
