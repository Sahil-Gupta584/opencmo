/*
  Warnings:

  - You are about to drop the column `intentScore` on the `reddit_thread` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "reddit_thread" DROP COLUMN "intentScore",
ADD COLUMN     "priority" TEXT DEFAULT 'medium';
