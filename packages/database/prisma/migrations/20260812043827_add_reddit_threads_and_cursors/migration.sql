/*
  Warnings:

  - You are about to drop the `thread_opportunity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "thread_opportunity" DROP CONSTRAINT "thread_opportunity_projectId_fkey";

-- AlterTable
ALTER TABLE "project_subreddit" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "thread_opportunity";

-- CreateTable
CREATE TABLE "reddit_thread" (
    "id" TEXT NOT NULL,
    "redditId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subreddit" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "author" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "redditCreatedAt" TIMESTAMP(3) NOT NULL,
    "intentScore" INTEGER,
    "intentReason" TEXT,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "generatedReply" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reddit_thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbound_cursor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subreddit" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbound_cursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reddit_thread_projectId_isDone_redditCreatedAt_idx" ON "reddit_thread"("projectId", "isDone", "redditCreatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "reddit_thread_projectId_redditId_key" ON "reddit_thread"("projectId", "redditId");

-- CreateIndex
CREATE UNIQUE INDEX "inbound_cursor_projectId_subreddit_keyword_key" ON "inbound_cursor"("projectId", "subreddit", "keyword");

-- CreateIndex
CREATE INDEX "project_subreddit_name_idx" ON "project_subreddit"("name");

-- AddForeignKey
ALTER TABLE "reddit_thread" ADD CONSTRAINT "reddit_thread_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbound_cursor" ADD CONSTRAINT "inbound_cursor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
