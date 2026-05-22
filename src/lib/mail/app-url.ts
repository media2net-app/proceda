/** Publieke app-URL voor outreach-mail en afspraak-CTA's (nooit localhost in productie-mails). */
export const PROCEDA_PUBLIC_APP_URL = "https://www.proceda.nl";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function readEnvAppUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.BASE_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (!raw) return null;
  const url = raw.includes("://") ? raw : `https://${raw}`;
  return normalizeBaseUrl(url);
}

function isLocalHost(host: string): boolean {
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h === "localhost" || h === "127.0.0.1" || h.endsWith(".local");
}

export function resolveAppBaseUrl(request?: Request): string {
  const fromEnv = readEnvAppUrl();
  if (fromEnv) return fromEnv;

  if (request) {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    if (host && !isLocalHost(host)) {
      return normalizeBaseUrl(`${proto}://${host}`);
    }
  }

  return PROCEDA_PUBLIC_APP_URL;
}
