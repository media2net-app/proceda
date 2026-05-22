/** Standaard makelaars-demo voor Product → Bekijk product. */
export const MAKELAARDIJ_PRODUCT_DEMO_SLUG = "schenkel-makelaardij";

export function makelaardijProductDemoAppPath(locale: string = "nl"): string {
  return `/${locale}/demos/${MAKELAARDIJ_PRODUCT_DEMO_SLUG}/app`;
}
