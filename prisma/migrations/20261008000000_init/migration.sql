-- CreateTable
CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitHit" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1
);

-- CreateIndex
CREATE UNIQUE INDEX "Space_token_key" ON "Space"("token");

-- CreateIndex
CREATE INDEX "RateLimitHit_windowStart_idx" ON "RateLimitHit"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitHit_key_windowStart_key" ON "RateLimitHit"("key", "windowStart");
