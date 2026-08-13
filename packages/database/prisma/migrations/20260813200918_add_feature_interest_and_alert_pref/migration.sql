-- CreateTable
CREATE TABLE "feature_interest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "interested" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_pref" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyInbounds" BOOLEAN NOT NULL DEFAULT true,
    "notifyOutbound" BOOLEAN NOT NULL DEFAULT true,
    "channels" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_pref_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_interest_userId_feature_key" ON "feature_interest"("userId", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "alert_pref_userId_key" ON "alert_pref"("userId");

-- AddForeignKey
ALTER TABLE "feature_interest" ADD CONSTRAINT "feature_interest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_pref" ADD CONSTRAINT "alert_pref_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
