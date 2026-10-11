import "server-only";
import { isGameOpen } from "@/lib/launch";
import { notFound } from "./http";

/** Whether this deployment serves the game (see src/lib/launch.ts). */
export function gameIsOpen(): boolean {
  return isGameOpen({ vercelEnv: process.env.VERCEL_ENV, live: process.env.WRAPARTY_LIVE });
}

/** For game API routes: a 404 before launch, so nothing can be played or probed early. */
export function rejectIfClosed() {
  return gameIsOpen() ? null : notFound();
}
