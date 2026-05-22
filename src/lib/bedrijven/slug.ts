export function businessIdToSlug(id: string): string {
  return encodeURIComponent(id);
}

export function slugToBusinessId(slug: string): string {
  return decodeURIComponent(slug);
}

/** Safe filename for screenshots — no slashes (avoids %2F URL issues in static serving). */
export function safeScreenshotFilename(businessId: string): string {
  return businessId.replace(/[/\\?%*:|"<>#&]/g, "--");
}

export function screenshotApiPath(businessId: string): string {
  return `/api/bedrijven/screenshot/${businessIdToSlug(businessId)}`;
}
