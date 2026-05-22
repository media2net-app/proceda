import {
  businessIdToDemoSlug,
  demoAppPublicPath,
  demoHomepagePublicPath,
} from "./demo-slug";
import {
  loadBusinessReport,
  saveBusinessReport,
} from "./business-report-storage";

/** Zet demo-URL's op bestaand rapport (zonder deep scrape). */
export async function patchReportDemoUrls(
  businessId: string,
  locale: string = "nl",
): Promise<boolean> {
  const report = await loadBusinessReport(businessId);
  if (!report) return false;

  const demoSlug = businessIdToDemoSlug(businessId);
  const demoAppUrl = demoAppPublicPath(demoSlug, locale);
  const demoHomepageUrl = demoHomepagePublicPath(demoSlug, locale);

  await saveBusinessReport({
    ...report,
    demoAppUrl,
    demoHomepageUrl,
  });
  return true;
}
