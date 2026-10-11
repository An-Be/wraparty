-- CreateEnum
CREATE TYPE "VsPar" AS ENUM ('UNDER', 'PAR', 'OVER');

-- CreateTable
CREATE TABLE "Puzzle" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "personAId" INTEGER NOT NULL,
    "personAName" TEXT NOT NULL,
    "personAImg" TEXT,
    "personBId" INTEGER NOT NULL,
    "personBName" TEXT NOT NULL,
    "personBImg" TEXT,
    "par" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Puzzle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solve" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "links" INTEGER NOT NULL,
    "vsPar" "VsPar" NOT NULL,
    "solvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitHit" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1
);

-- CreateIndex
CREATE UNIQUE INDEX "Puzzle_date_key" ON "Puzzle"("date");

-- CreateIndex
CREATE INDEX "Solve_date_idx" ON "Solve"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Solve_date_deviceId_key" ON "Solve"("date", "deviceId");

-- CreateIndex
CREATE INDEX "RateLimitHit_windowStart_idx" ON "RateLimitHit"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitHit_key_windowStart_key" ON "RateLimitHit"("key", "windowStart");

-- AddForeignKey
ALTER TABLE "Solve" ADD CONSTRAINT "Solve_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "Puzzle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
