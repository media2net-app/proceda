import * as cheerio from "cheerio";

function resolveUrl(base: string, href: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function isUsefulImage(src: string): boolean {
  const s = src.toLowerCase();
  if (s.includes("pixel") || s.includes("tracking") || s.includes("1x1")) {
    return false;
  }
  if (s.endsWith(".svg") && s.includes("icon")) return false;
  return !s.includes("spacer");
}

export function parseHexOrRgb(color: string): string | null {
  const c = color.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(c)) return c;
  const rgb = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) {
    const [, r, g, b] = rgb;
    const hex = (n: string) =>
      parseInt(n, 10).toString(16).padStart(2, "0");
    return `#${hex(r!)}${hex(g!)}${hex(b!)}`;
  }
  return null;
}

export function extractBrandFromHtml(
  html: string,
  pageUrl: string,
): {
  logoUrl: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  imageUrls: string[];
  colors: string[];
  fontFamily: string | null;
} {
  const $ = cheerio.load(html);
  const imageUrls: string[] = [];
  const colors = new Set<string>();

  const theme = $('meta[name="theme-color"]').attr("content");
  if (theme) {
    const p = parseHexOrRgb(theme);
    if (p) colors.add(p);
  }

  $("style").each((_, el) => {
    const css = $(el).html() ?? "";
    const matches = css.match(/#[0-9a-fA-F]{3,8}|rgb\([^)]+\)/g) ?? [];
    for (const m of matches) {
      const p = parseHexOrRgb(m);
      if (p) colors.add(p);
    }
    const vars = css.match(/--[\w-]+:\s*([^;]+)/g) ?? [];
    for (const v of vars) {
      const val = v.split(":")[1]?.trim();
      if (val) {
        const p = parseHexOrRgb(val);
        if (p) colors.add(p);
      }
    }
  });

  let logoUrl: string | null = null;
  const logoSelectors = [
    "header img",
    ".logo img",
    "#logo img",
    "a.logo img",
    '[class*="logo"] img',
    "nav img",
  ];
  for (const sel of logoSelectors) {
    const src = $(sel).first().attr("src");
    if (src) {
      logoUrl = resolveUrl(pageUrl, src);
      if (logoUrl) break;
    }
  }

  const ogImage = $('meta[property="og:image"]').attr("content");
  let heroImageUrl = ogImage ? resolveUrl(pageUrl, ogImage) : null;

  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (!src) return;
    const abs = resolveUrl(pageUrl, src);
    if (!abs || !isUsefulImage(abs)) return;
    imageUrls.push(abs);
    const w = parseInt($(el).attr("width") ?? "0", 10);
    const h = parseInt($(el).attr("height") ?? "0", 10);
    if (!heroImageUrl && (w >= 200 || h >= 150 || abs.includes("hero"))) {
      heroImageUrl = abs;
    }
  });

  const icon =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href");
  const faviconUrl = icon ? resolveUrl(pageUrl, icon) : null;

  const fontLink = $('link[href*="fonts.googleapis"]').attr("href");
  let fontFamily: string | null = null;
  if (fontLink) {
    const m = fontLink.match(/family=([^&:+]+)/);
    if (m) fontFamily = m[1]!.replace(/\+/g, " ");
  }

  return {
    logoUrl,
    faviconUrl,
    heroImageUrl,
    imageUrls: [...new Set(imageUrls)].slice(0, 40),
    colors: [...colors],
    fontFamily,
  };
}

export function pickBrandPalette(colorList: string[]): {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
} {
  const hex = colorList
    .map(parseHexOrRgb)
    .filter((c): c is string => !!c && c !== "#ffffff" && c !== "#fff");

  const defaults = {
    primaryColor: "#1e3a5f",
    secondaryColor: "#2d5a87",
    accentColor: "#c9a227",
    textColor: "#1a1a2e",
  };

  if (hex.length === 0) return defaults;

  const sorted = hex.sort((a, b) => {
    const lum = (c: string) => {
      const r = parseInt(c.slice(1, 3), 16);
      const g = parseInt(c.slice(3, 5), 16);
      const b2 = parseInt(c.slice(5, 7), 16);
      return (r + g + b2) / 3;
    };
    return lum(a) - lum(b);
  });

  const dark = sorted.filter((c) => {
    const r = parseInt(c.slice(1, 3), 16);
    return r < 120;
  });
  const bright = sorted.filter((c) => {
    const r = parseInt(c.slice(1, 3), 16);
    return r > 140;
  });

  return {
    primaryColor: dark[0] ?? sorted[0] ?? defaults.primaryColor,
    secondaryColor: dark[1] ?? sorted[1] ?? defaults.secondaryColor,
    accentColor: bright[bright.length - 1] ?? sorted[sorted.length - 1] ?? defaults.accentColor,
    textColor: "#1a1a2e",
  };
}
