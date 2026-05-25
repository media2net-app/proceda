import DemoAppShell from "@/components/demo-app/DemoAppShell";
import RecruitmentAppShell from "@/components/demo-app/RecruitmentAppShell";
import { MakelaarPortalProvider } from "@/components/demo-app/MakelaarPortalContext";
import { RecruitmentPortalProvider } from "@/components/demo-app/RecruitmentPortalContext";
import { getDemoAppBrand } from "@/lib/demo-app/config";
import { buildMakelaarPortalData } from "@/lib/demo-app/makelaar-portal-data";
import { buildRecruitmentPortalData } from "@/lib/demo-app/recruitment-portal-data";
import { resolveDemoPortalKind } from "@/lib/demo-app/resolve-demo-portal-kind";
import { demoSlugToBusinessId } from "@/lib/bedrijven/demo-slug";
import { getDemoBrandEntry } from "@/lib/demo-homepage/demo-brand-registry";
import { loadDeepScrape } from "@/lib/bedrijven/deep-scrape-storage";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
};

export default async function DemoAppLayoutRoute({ children, params }: LayoutProps) {
  const { locale, slug } = await params;
  const brand = getDemoAppBrand(slug, locale);
  const kind = await resolveDemoPortalKind(slug);
  const entry = getDemoBrandEntry(slug);
  const businessId = demoSlugToBusinessId(slug, entry?.businessId);

  if (kind === "recruitment") {
    const data = buildRecruitmentPortalData(brand.businessName);
    return (
      <RecruitmentPortalProvider brand={brand} slug={slug} data={data}>
        <RecruitmentAppShell>{children}</RecruitmentAppShell>
      </RecruitmentPortalProvider>
    );
  }

  const deep = await loadDeepScrape(businessId);
  const data = buildMakelaarPortalData(deep?.listings, slug);

  return (
    <MakelaarPortalProvider brand={brand} slug={slug} data={data}>
      <DemoAppShell>{children}</DemoAppShell>
    </MakelaarPortalProvider>
  );
}
