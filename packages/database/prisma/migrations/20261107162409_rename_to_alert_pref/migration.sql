/*
  Warnings:

  - You are about to drop the `AlertPref` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AlertPref" DROP CONSTRAINT "AlertPref_userId_fkey";

-- DropTable
DROP TABLE "AlertPref";

-- CreateTable
CREATE TABLE "alert_pref" (
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

    CONSTRAINT "alert_pref_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alert_pref_userId_key" ON "alert_pref"("userId");

-- AddForeignKey
ALTER TABLE "alert_pref" ADD CONSTRAINT "alert_pref_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
