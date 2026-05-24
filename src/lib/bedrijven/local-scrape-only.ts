import "server-only";

/** Lead-scrape/autopilot ticks alleen lokaal — niet op Vercel serverless. */
export function isLocalScrapeEnvironment(): boolean {
  if (process.env.SCRAPE_ALLOW_VERCEL === "1") return true;
  return process.env.VERCEL !== "1";
}

export const LOCAL_SCRAPE_ONLY_MESSAGE =
  "Lead-scrape draait alleen op localhost (npm run dev). Live/Vercel is uitgeschakeld.";
