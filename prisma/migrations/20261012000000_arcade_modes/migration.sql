-- Turns the single movie game into an arcade of game modes. Keeps every
-- existing puzzle and solve: they become the Movies mode's.

-- CreateEnum
CREATE TYPE "ModeStatus" AS ENUM ('LIVE', 'SOON');

-- CreateTable
CREATE TABLE "GameMode" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "status" "ModeStatus" NOT NULL,
    "statusLabel" TEXT NOT NULL,
    "entityLabel" TEXT NOT NULL,
    "edgeLabel" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GameMode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameMode_slug_key" ON "GameMode"("slug");

-- Seed the modes from the spec. Only Movies is live; the rest are "coming
-- soon" cards, which double as a signal for what to build next.
INSERT INTO "GameMode" ("id", "slug", "name", "tagline", "status", "statusLabel", "entityLabel", "edgeLabel", "sortOrder") VALUES
    ('mode_movies', 'movies', 'Movies', 'Connect two people through the movies they made.', 'LIVE', 'live', 'person', 'movie', 0),
    ('mode_music', 'music', 'Music', 'Artists through collaborations, bands and producers.', 'SOON', 'tuning up', 'artist', 'collaboration', 1),
    ('mode_sports', 'sports', 'Sports', 'Players through the teams they shared.', 'SOON', 'in rehearsal', 'player', 'team', 2);

-- Puzzle: person* becomes entity*, ids become text, and every row joins Movies.
ALTER TABLE "Puzzle" RENAME COLUMN "personAId" TO "entityAId";
ALTER TABLE "Puzzle" RENAME COLUMN "personAName" TO "entityAName";
ALTER TABLE "Puzzle" RENAME COLUMN "personAImg" TO "entityAImg";
ALTER TABLE "Puzzle" RENAME COLUMN "personBId" TO "entityBId";
ALTER TABLE "Puzzle" RENAME COLUMN "personBName" TO "entityBName";
ALTER TABLE "Puzzle" RENAME COLUMN "personBImg" TO "entityBImg";
ALTER TABLE "Puzzle" ALTER COLUMN "entityAId" SET DATA TYPE TEXT USING "entityAId"::text;
ALTER TABLE "Puzzle" ALTER COLUMN "entityBId" SET DATA TYPE TEXT USING "entityBId"::text;
ALTER TABLE "Puzzle" ADD COLUMN "modeId" TEXT;
UPDATE "Puzzle" SET "modeId" = 'mode_movies';
ALTER TABLE "Puzzle" ALTER COLUMN "modeId" SET NOT NULL;

-- One puzzle per mode per date (was: per date).
DROP INDEX "Puzzle_date_key";
CREATE UNIQUE INDEX "Puzzle_modeId_date_key" ON "Puzzle"("modeId", "date");

-- Solve: scoped to a mode too, backfilled from its puzzle.
ALTER TABLE "Solve" ADD COLUMN "modeId" TEXT;
UPDATE "Solve" s SET "modeId" = p."modeId" FROM "Puzzle" p WHERE p."id" = s."puzzleId";
ALTER TABLE "Solve" ALTER COLUMN "modeId" SET NOT NULL;
DROP INDEX "Solve_date_deviceId_key";
DROP INDEX "Solve_date_idx";
CREATE UNIQUE INDEX "Solve_modeId_date_deviceId_key" ON "Solve"("modeId", "date", "deviceId");
CREATE INDEX "Solve_modeId_date_idx" ON "Solve"("modeId", "date");

-- AddForeignKey
ALTER TABLE "Puzzle" ADD CONSTRAINT "Puzzle_modeId_fkey" FOREIGN KEY ("modeId") REFERENCES "GameMode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solve" ADD CONSTRAINT "Solve_modeId_fkey" FOREIGN KEY ("modeId") REFERENCES "GameMode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
