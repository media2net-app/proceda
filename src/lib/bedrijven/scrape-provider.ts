import "server-only";

export type ScrapeProvider = "browser" | "google";

/** Google Places API is uit tenzij expliciet GOOGLE_PLACES_ENABLED=true. */
export function resolveScrapeProvider(): ScrapeProvider {
  if (process.env.GOOGLE_PLACES_ENABLED === "true") {
    return "google";
  }
  return "browser";
}

export function isGoogleScrapeEnabled(): boolean {
  return resolveScrapeProvider() === "google";
}
