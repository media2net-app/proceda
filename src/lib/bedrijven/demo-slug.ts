/** Folder-safe slug for demo assets (public/demos/{demoSlug}/). */
export function businessIdToDemoSlug(businessId: string): string {
  return businessId
    .replace(/^manual\//, "")
    .replace(/[/\\?%*:|"<>#&]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function demoHomepagePublicPath(
  demoSlug: string,
  locale: string = "nl",
): string {
  return `/${locale}/demos/${demoSlug}`;
}

export function demoAppPublicPath(
  demoSlug: string,
  locale: string = "nl",
): string {
  return `/${locale}/demos/${demoSlug}/app`;
}

/** businessId → demo slug (inverse of businessIdToDemoSlug for known seeds). */
export function demoSlugFromBusinessId(businessId: string): string {
  return businessIdToDemoSlug(businessId);
}

/** Demo-URL-slug → businessId (browser/google/manual prefixes). */
export function demoSlugToBusinessId(
  slug: string,
  entryBusinessId?: string | null,
): string {
  if (entryBusinessId?.trim()) return entryBusinessId;
  if (slug.startsWith("browser-")) return `browser/${slug.slice("browser-".length)}`;
  if (slug.startsWith("google-")) return `google/${slug.slice("google-".length)}`;
  return `manual/${slug}`;
}
