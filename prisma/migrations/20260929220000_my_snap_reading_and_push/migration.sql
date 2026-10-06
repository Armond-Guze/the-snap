CREATE TABLE "SavedArticle" (
 "userId" UUID NOT NULL, "href" VARCHAR(300) NOT NULL, "title" VARCHAR(500) NOT NULL,
 "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "SavedArticle_pkey" PRIMARY KEY ("userId", "href"),
 CONSTRAINT "SavedArticle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SavedArticle_userId_savedAt_idx" ON "SavedArticle"("userId", "savedAt");
CREATE TABLE "PushDevice" (
 "id" UUID NOT NULL, "userId" UUID NOT NULL, "endpoint" TEXT NOT NULL,
 "p256dh" TEXT NOT NULL, "auth" TEXT NOT NULL, "team" VARCHAR(3) NOT NULL,
 "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "leaseUntil" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "PushDevice_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "PushDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PushDevice_endpoint_key" ON "PushDevice"("endpoint");
CREATE INDEX "PushDevice_userId_idx" ON "PushDevice"("userId");
CREATE INDEX "PushDevice_checkedAt_idx" ON "PushDevice"("checkedAt");
