import DemoAppShell from "@/components/demo-app/DemoAppShell";
import { MakelaarPortalProvider } from "@/components/demo-app/MakelaarPortalContext";
import { getDemoAppBrand } from "@/lib/demo-app/config";
import { buildMakelaarPortalData } from "@/lib/demo-app/makelaar-portal-data";
import { loadDeepScrape } from "@/lib/bedrijven/deep-scrape-storage";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
};

export default async function DemoAppLayoutRoute({ children, params }: LayoutProps) {
  const { locale, slug } = await params;
  const brand = getDemoAppBrand(slug, locale);
  const businessId = slug.includes("/") ? slug : `manual/${slug}`;
  const deep = await loadDeepScrape(businessId);
  const data = buildMakelaarPortalData(deep?.listings, slug);

  return (
    <MakelaarPortalProvider brand={brand} slug={slug} data={data}>
      <DemoAppShell>{children}</DemoAppShell>
    </MakelaarPortalProvider>
  );
}
