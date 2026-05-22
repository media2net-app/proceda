import * as cheerio from "cheerio";

const JUNK_EMAIL_DOMAINS =
  /^(noreply|no-reply|donotreply|mailer-daemon|postmaster|admin@example|user@example)/i;

const JUNK_EMAIL_SUFFIX =
  /@(example\.com|sentry\.wixpress\.com|wix\.com|domain\.com|email\.com|yourdomain\.|sentry\.io|w3\.org|schema\.org)/i;

const CONTACT_PATH_HINTS =
  /contact|contacteer|contactgegevens|bereik|reach|over-ons|about|info|klantenservice|support|offerte|aanvraag/i;

const PREFERRED_LOCAL_PART =
  /^(info|contact|mail|office|sales|service|support|klantenservice|hello|hallo|enquiry|aanvraag)$/i;

export function normalizeEmail(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  let email = raw.trim().toLowerCase().replace(/^mailto:/i, "");
  email = email.split("?")[0]?.trim() ?? "";
  // Footer-tekst plakt soms aan het domein: info@x.nltelefoon / .nlkvk
  const glued = email.match(
    /^([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,6})(?:telefoon|tel|phone|mobiel|fax|kvk|btw|iban).*$/i,
  );
  if (glued) email = glued[1]!;
  const base = email;
  if (!base || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(base)) return undefined;
  if (JUNK_EMAIL_DOMAINS.test(base) || JUNK_EMAIL_SUFFIX.test(base)) return undefined;
  if (base.endsWith(".png") || base.endsWith(".jpg")) return undefined;
  return base;
}

export function normalizePhone(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 9) return undefined;
  return raw.trim();
}

export function hasAutoMailerContact(b: {
  email?: string;
  website?: string;
}): boolean {
  return !!normalizeEmail(b.email);
}

export function hasCallListContact(b: { phone?: string }): boolean {
  return !!normalizePhone(b.phone);
}

function scoreEmailCandidate(email: string, bonus: number): number {
  const local = email.split("@")[0] ?? "";
  let score = 8 + bonus;
  if (PREFERRED_LOCAL_PART.test(local)) score += 25;
  else if (/info|contact|mail|service|support/i.test(local)) score += 12;
  if (local.length > 28) score -= 5;
  return score;
}

function collectCandidates(html: string, boostFooter = false): string[] {
  const $ = cheerio.load(html);
  const scored: { email: string; score: number }[] = [];

  const addFromScope = (scope: ReturnType<typeof $>, bonus: number) => {
    scope.find('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const raw = href.replace(/^mailto:/i, "").split("?")[0];
      const email = normalizeEmail(raw);
      if (email) scored.push({ email, score: scoreEmailCandidate(email, 20 + bonus) });
    });

    const text = scope.text();
    const matches = text.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    );
    for (const m of matches ?? []) {
      const email = normalizeEmail(m);
      if (email) scored.push({ email, score: scoreEmailCandidate(email, bonus) });
    }
  };

  if (boostFooter) {
    $("footer, [role='contentinfo'], .footer, #footer, .site-footer").each(
      (_, el) => addFromScope($(el), 15),
    );
  }

  addFromScope($("body"), 0);
  addFromScope($("header"), 3);

  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { email } of scored) {
    if (seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

/** Parse HTML from homepage/footer (Puppeteer of fetch). */
export function extractEmailFromHtml(html: string): string | undefined {
  if (!html || html.length < 50) return undefined;
  const candidates = collectCandidates(html, true);
  return candidates[0];
}

function normalizeSiteUrl(base: string, href: string): string | undefined {
  try {
    const resolved = new URL(href, base);
    if (!/^https?:$/i.test(resolved.protocol)) return undefined;
    return resolved.href;
  } catch {
    return undefined;
  }
}

/** Contactpagina-URLs uit navigatie/footer. */
export function findContactPageUrls(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const found = new Set<string>();

  const guessPaths = [
    "/contact",
    "/contact/",
    "/contactgegevens",
    "/contact-gegevens",
    "/contacteer-ons",
    "/neem-contact-op",
    "/contact-us",
    "/nl/contact",
    "/over-ons",
    "/over-ons/contact",
    "/about",
    "/about-us",
    "/info",
    "/klantenservice",
    "/support",
  ];

  for (const path of guessPaths) {
    try {
      const u = new URL(path, base.origin);
      if (u.origin === base.origin) found.add(u.href);
    } catch {
      // skip
    }
  }

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
    const text = $(el).text().toLowerCase();
    const combined = `${text} ${href}`.toLowerCase();
    if (!CONTACT_PATH_HINTS.test(combined)) return;
    const resolved = normalizeSiteUrl(baseUrl, href);
    if (resolved && new URL(resolved).origin === base.origin) {
      found.add(resolved);
    }
  });

  return [...found].slice(0, 6);
}

const COMMON_CONTACT_PATHS = [
  "/contact",
  "/contact/",
  "/contactgegevens",
  "/contact-gegevens",
  "/nl/contact",
  "/contacteer-ons",
  "/neem-contact-op",
  "/contact-us",
  "/over-ons/contact",
  "/klantenservice",
];

/** Fetch homepage + contactpagina's (enrich tijdens Places-scrape). */
export async function extractEmailFromWebsite(
  websiteUrl: string,
): Promise<string | undefined> {
  const base = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
  let origin: string;
  try {
    origin = new URL(base).origin;
  } catch {
    return undefined;
  }

  const urls = [base];
  for (const path of COMMON_CONTACT_PATHS) {
    try {
      urls.push(new URL(path, origin).href);
    } catch {
      // skip
    }
  }

  const visited = new Set<string>();

  for (const url of urls) {
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html",
        },
        redirect: "follow",
      });
      if (!res.ok) continue;
      const html = (await res.text()).slice(0, 150_000);
      const email = extractEmailFromHtml(html);
      if (email) return email;

      const contactUrls = findContactPageUrls(html, url);
      for (const contactUrl of contactUrls) {
        if (visited.has(contactUrl)) continue;
        visited.add(contactUrl);
        try {
          const res2 = await fetch(contactUrl, {
            signal: AbortSignal.timeout(8000),
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
              Accept: "text/html",
            },
            redirect: "follow",
          });
          if (!res2.ok) continue;
          const html2 = (await res2.text()).slice(0, 150_000);
          const email2 = extractEmailFromHtml(html2);
          if (email2) return email2;
        } catch {
          // volgende contact-url
        }
      }
    } catch {
      // try next url
    }
  }

  return undefined;
}

/** Platform-domeinen waar info@ niet zinvol is. */
const GUESS_EMAIL_BLOCKLIST = new Set([
  "facebook.com",
  "fb.com",
  "instagram.com",
  "linkedin.com",
  "google.com",
  "google.nl",
  "g.page",
  "goo.gl",
  "bit.ly",
  "linktr.ee",
  "wix.com",
  "wixsite.com",
  "wordpress.com",
  "blogspot.com",
  "squarespace.com",
  "webflow.io",
  "jimdosite.com",
  "site123.com",
  "onepage.website",
  "herokuapp.com",
  "github.io",
  "pages.dev",
]);

function apexDomainFromHost(host: string): string | null {
  const h = host.toLowerCase().replace(/^www\./, "").trim();
  if (!h || h.includes("localhost") || /^\d+\.\d+\.\d+\.\d+$/.test(h)) {
    return null;
  }
  const parts = h.split(".").filter(Boolean);
  if (parts.length < 2) return null;

  const twoPartTlds = new Set([
    "co.uk",
    "com.au",
    "co.nl",
    "com.br",
    "co.za",
  ]);
  const last2 = parts.slice(-2).join(".");
  const last3 = parts.slice(-3).join(".");

  if (parts.length >= 3 && twoPartTlds.has(last2)) {
    return last3;
  }
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }
  return h;
}

/**
 * Fallback: info@{domein uit website-URL} — gangbaar bij NL-MKB.
 * Alleen als er een eigen domein is (geen Facebook/Wix-pagina's).
 */
export function guessInfoEmailFromWebsite(
  websiteUrl: string,
): string | undefined {
  let host: string;
  try {
    const url = websiteUrl.trim().startsWith("http")
      ? websiteUrl.trim()
      : `https://${websiteUrl.trim()}`;
    host = new URL(url).hostname;
  } catch {
    return undefined;
  }

  const domain = apexDomainFromHost(host);
  if (!domain) return undefined;
  if (GUESS_EMAIL_BLOCKLIST.has(domain)) return undefined;
  if (
    domain.endsWith(".facebook.com") ||
    domain.includes("googleusercontent") ||
    domain.includes("wixpress")
  ) {
    return undefined;
  }

  return normalizeEmail(`info@${domain}`);
}
