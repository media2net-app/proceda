import type { Bedrijf } from "./types";
import type { BusinessReport } from "./business-report-types";
import { runDeepScrape } from "./deep-scrape";
import { saveDeepScrape } from "./deep-scrape-storage";
import { generateDemoHomepage } from "@/lib/demo-homepage/generate-demo-homepage";
import { businessIdToDemoSlug, demoAppPublicPath } from "@/lib/bedrijven/demo-slug";
import { generateBusinessReport } from "./generate-business-report";
import {
  loadBusinessReport,
  saveBusinessReport,
} from "./business-report-storage";
import { patchBusinessContact } from "./patch-business-contact";

export type FullReportResult = {
  report: BusinessReport;
  demoHomepageUrl: string;
  demoAppUrl: string;
  pagesScraped: number;
  deepScrapeErrors: string[];
};

export async function generateFullBusinessReport(
  business: Bedrijf,
): Promise<FullReportResult> {
  console.log(`[full-report] Deep scrape: ${business.name}…`);
  const deep = await runDeepScrape(business);
  await saveDeepScrape(deep);

  if (deep.contact.emails[0]) {
    await patchBusinessContact(business.id, {
      email: deep.contact.emails[0],
    });
  }

  console.log(`[full-report] Standard report + AI…`);
  const businessWithEmail: Bedrijf = {
    ...business,
    email: deep.contact.emails[0] ?? business.email,
    phone: deep.contact.phones[0] ?? business.phone,
  };

  let report = await generateBusinessReport(businessWithEmail);

  const demoHomepageUrl = await generateDemoHomepage(businessWithEmail, deep);
  const demoSlug = businessIdToDemoSlug(business.id);
  const demoAppUrl = demoAppPublicPath(demoSlug);
  console.log(`[full-report] Demo homepage: ${demoHomepageUrl}`);
  console.log(`[full-report] Demo webapp: ${demoAppUrl}`);

  const websiteIdea = `Moderne nieuwe website (concept: ${demoHomepageUrl}) — mobiel-first, sneller, betere conversie voor woningaanbod.`;
  const appIdea = `Makelaarsportaal / CRM-dashboard (concept: ${demoAppUrl}) — woningaanbod, leads, bezichtigingen en taxaties in één overzicht.`;
  const hasWebsiteIdea = report.ai.webApplicationIdeas.some((i) =>
    /website|homepage/i.test(i),
  );

  const hasAppIdea = report.ai.webApplicationIdeas.some((i) =>
    /portaal|dashboard|crm/i.test(i),
  );

  report = {
    ...report,
    demoHomepageUrl,
    demoAppUrl,
    deepScrape: {
      scrapedAt: deep.scrapedAt,
      pagesScraped: deep.pages.length,
      brandColors: [
        deep.brand.primaryColor,
        deep.brand.secondaryColor,
        deep.brand.accentColor,
      ],
      tagline: deep.tagline,
      services: deep.services,
      logoUrl: deep.brand.logoUrl,
    },
    ai: {
      ...report.ai,
      webApplicationIdeas: [
        ...(hasWebsiteIdea ? [] : [websiteIdea]),
        ...(hasAppIdea ? [] : [appIdea]),
        ...report.ai.webApplicationIdeas,
      ].slice(0, 5),
      companySummary: `${report.ai.companySummary} Proceda heeft een demo-homepage (${demoHomepageUrl}) en webapp-dashboard (${demoAppUrl}) in hun huisstijl klaargezet.`,
    },
  };

  await saveBusinessReport(report);

  return {
    report,
    demoHomepageUrl,
    demoAppUrl,
    pagesScraped: deep.pages.length,
    deepScrapeErrors: deep.errors,
  };
}

export async function loadFullReportBundle(businessId: string) {
  const report = await loadBusinessReport(businessId);
  const { loadDeepScrape } = await import("./deep-scrape-storage");
  const deep = await loadDeepScrape(businessId);
  return { report, deep };
}
