import { z } from "zod";

// Shared by the API routes (validation) and forms (limits). Pure, no server imports.
export const TITLE_MAX = 40;

export const spaceTitle = z
  .string({ error: "Give it a name." })
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(1, "Give it a name.").max(TITLE_MAX, `Keep it under ${TITLE_MAX} characters.`));

export const createSpaceSchema = z.object({ title: spaceTitle });
export const updateSpaceSchema = z.object({ title: spaceTitle });
