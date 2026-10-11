// Launch switch. Production stays on the "crew is setting up" screen, with the
// game's API routes closed, until WRAPARTY_LIVE=true is set for Production in
// Vercel (and the project redeployed). Local dev and preview deploys are
// always open, so the game can be tested end to end before launch.

export type LaunchEnv = { vercelEnv?: string; live?: string };

export function isGameOpen({ vercelEnv, live }: LaunchEnv): boolean {
  if (vercelEnv !== "production") return true;
  return live?.trim().toLowerCase() === "true";
}
