-- Mode lineup, data only (no schema change): Movies is live; Music, Art and
-- Anime are "coming soon". Sports is dropped (no puzzles or solves reference
-- it). Movies' tagline covers acting too, not just making.

DELETE FROM "GameMode" WHERE "id" = 'mode_sports';

UPDATE "GameMode"
SET "tagline" = 'Connect two people through the movies they made or were in.'
WHERE "id" = 'mode_movies';

UPDATE "GameMode"
SET "tagline" = 'Artists through features, bands and producers.', "statusLabel" = 'coming soon', "sortOrder" = 1
WHERE "id" = 'mode_music';

INSERT INTO "GameMode" ("id", "slug", "name", "tagline", "status", "statusLabel", "entityLabel", "edgeLabel", "sortOrder") VALUES
    ('mode_art', 'art', 'Art', 'Artists through movements, teachers and galleries.', 'SOON', 'coming soon', 'artist', 'connection', 2),
    ('mode_anime', 'anime', 'Anime', 'Voice actors through the shows they voiced.', 'SOON', 'coming soon', 'voice actor', 'show', 3);
