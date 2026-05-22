import * as cheerio from "cheerio";

const JUNK_EMAIL_DOMAINS =
  /^(noreply|no-reply|donotreply|mailer-daemon|postmaster|admin@example|user@example)/i;

const JUNK_EMAIL_SUFFIX =
  /@(example\.com|sentry\.wixpress\.com|wix\.com|domain\.com|email\.com|yourdomain\.|sentry\.io|w3\.org|schema\.org)/i;

const CONTACT_PATH_HINTS =
  /contact|contacteer|bereik|reach|over-ons|about|info|klantenservice|support/i;

export function normalizeEmail(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const email = raw.trim().toLowerCase().replace(/^mailto:/i, "");
  const base = email.split("?")[0]?.trim();
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

function collectCandidates(html: string, boostFooter = false): string[] {
  const $ = cheerio.load(html);
  const scored: { email: string; score: number }[] = [];

  const addFromScope = (scope: ReturnType<typeof $>, bonus: number) => {
    scope.find('a[href^="mailto:"]').each((_, el) => {
      const href = $(el).attr("href") ?? "";
      const raw = href.replace(/^mailto:/i, "").split("?")[0];
      const email = normalizeEmail(raw);
      if (email) scored.push({ email, score: 20 + bonus });
    });

    const text = scope.text();
    const matches = text.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    );
    for (const m of matches ?? []) {
      const email = normalizeEmail(m);
      if (email) scored.push({ email, score: 8 + bonus });
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
    "/contacteer-ons",
    "/contact-us",
    "/nl/contact",
    "/over-ons",
    "/about",
    "/info",
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

  return [...found].slice(0, 4);
}

const COMMON_CONTACT_PATHS = [
  "/contact",
  "/contact/",
  "/nl/contact",
  "/contacteer-ons",
  "/contact-us",
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

      for (const contactUrl of findContactPageUrls(html, url)) {
        if (visited.has(contactUrl)) continue;
        visited.add(contactUrl);
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
      }
    } catch {
      // try next url
    }
  }

  return undefined;
}
