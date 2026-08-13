/*
  Warnings:

  - You are about to drop the column `subscribers` on the `project_subreddit` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "project" ADD COLUMN     "isFetching" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "project_subreddit" DROP COLUMN "subscribers";
