-- CreateTable
CREATE TABLE "Todo" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "subscriptionId" TEXT,
    "subscriptionStatus" TEXT DEFAULT 'inactive',
    "plan" TEXT DEFAULT 'FREE',
    "notifyNewLeads" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "description" TEXT NOT NULL,
    "targetAudience" TEXT,
    "keywords" TEXT[],
    "isFetching" BOOLEAN NOT NULL DEFAULT false,
    "lastFetchedAt" TIMESTAMP(3),
    "isGeneratingContent" BOOLEAN NOT NULL DEFAULT false,
    "lastContentGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_api_config" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultProvider" TEXT NOT NULL DEFAULT 'openai',
    "openaiKey" TEXT,
    "anthropicKey" TEXT,
    "geminiKey" TEXT,
    "openrouterKey" TEXT,
    "twitterBearerToken" TEXT,
    "baseUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_api_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_subreddit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relevance" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "rulesJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_subreddit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reddit_thread" (
    "id" TEXT NOT NULL,
    "redditId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'reddit',
    "projectId" TEXT NOT NULL,
    "subreddit" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "author" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "redditCreatedAt" TIMESTAMP(3) NOT NULL,
    "priority" TEXT DEFAULT 'medium',
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

-- CreateTable
CREATE TABLE "content_draft" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subreddit" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'POST',
    "title" TEXT,
    "content" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "riskReport" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionUrl" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "user_api_config_userId_key" ON "user_api_config"("userId");

-- CreateIndex
CREATE INDEX "project_subreddit_name_idx" ON "project_subreddit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "project_subreddit_projectId_name_key" ON "project_subreddit"("projectId", "name");

-- CreateIndex
CREATE INDEX "reddit_thread_projectId_channel_isDone_redditCreatedAt_idx" ON "reddit_thread"("projectId", "channel", "isDone", "redditCreatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "reddit_thread_projectId_redditId_key" ON "reddit_thread"("projectId", "redditId");

-- CreateIndex
CREATE UNIQUE INDEX "inbound_cursor_projectId_subreddit_keyword_key" ON "inbound_cursor"("projectId", "subreddit", "keyword");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_api_config" ADD CONSTRAINT "user_api_config_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_subreddit" ADD CONSTRAINT "project_subreddit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reddit_thread" ADD CONSTRAINT "reddit_thread_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbound_cursor" ADD CONSTRAINT "inbound_cursor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_draft" ADD CONSTRAINT "content_draft_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_task" ADD CONSTRAINT "daily_task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
