import "server-only";

/** Browser-scrape voortgang in DB i.p.v. data/ (Vercel heeft read-only filesystem). */
export function useScrapeDatabase(): boolean {
  if (process.env.SCRAPE_USE_DB === "1") return true;
  if (process.env.SCRAPE_USE_DB === "0") return false;
  return process.env.VERCEL === "1";
}
