-- DropIndex
DROP INDEX "reddit_thread_projectId_isDone_redditCreatedAt_idx";

-- AlterTable
ALTER TABLE "reddit_thread" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'reddit';

-- CreateIndex
CREATE INDEX "reddit_thread_projectId_channel_isDone_redditCreatedAt_idx" ON "reddit_thread"("projectId", "channel", "isDone", "redditCreatedAt");
