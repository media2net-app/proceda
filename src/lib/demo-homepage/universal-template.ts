import type { Bedrijf } from "@/lib/bedrijven/types";
import type { DeepScrapeResult } from "@/lib/bedrijven/deep-scrape-types";
import type { BrandOverride } from "./brand-overrides";
import {
  getBranchCopy,
  resolveDemoBranch,
  type BranchCopy,
  type DemoBranch,
} from "./branch-config";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type OfferItem = {
  badge: string;
  title: string;
  meta: string;
  price: string;
  imageSrc?: string | null;
};

function extractMakelaarOffers(deep: DeepScrapeResult): OfferItem[] {
  const items: OfferItem[] = [];
  const text = deep.pages.flatMap((p) => p.paragraphs).join("\n");
  const re =
    /(Nieuw|Te koop|Onder bod)\s+(.+?)\s+(\d{4}\s*[A-Z]{2})\s+([^€]+?)\s+€\s*([\d.,]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null && items.length < 6) {
    items.push({
      badge: m[1]!,
      title: `${m[2]!.trim()}, ${m[3]!.trim()}`,
      meta: m[4]!.trim(),
      price: `€ ${m[5]!.trim().replace(/,-$/, "")}`,
    });
  }
  return items;
}

function extractOffers(
  branch: DemoBranch,
  deep: DeepScrapeResult,
  business: Bedrijf,
  copy: BranchCopy,
  assetBase: string,
): OfferItem[] {
  const fromListings = (deep.listings ?? []).slice(0, 6).map((l) => ({
    badge: l.badge,
    title: l.title,
    meta: l.city,
    price: l.price,
    imageSrc: l.imageLocalPath ? `${assetBase}/${l.imageLocalPath}` : null,
  }));
  if (fromListings.length > 0) return fromListings;

  if (branch === "makelaar") {
    const scraped = extractMakelaarOffers(deep);
    if (scraped.length > 0) return scraped;
  }

  return Array.from({ length: 3 }, () => ({
    badge: copy.defaultItemBadge,
    title: copy.placeholderTitle,
    meta: business.city,
    price: copy.placeholderPrice,
    imageSrc: null,
  }));
}

function resolveHeroBackground(
  deep: DeepScrapeResult,
  assetBase: string,
  fallback: string,
): string {
  if (deep.brand.heroImageLocalPath) {
    return `${assetBase}/${deep.brand.heroImageLocalPath}`;
  }
  return fallback;
}

function pickHeroTitle(
  deep: DeepScrapeResult,
  business: Bedrijf,
  branch: DemoBranch,
): string {
  const h1 = deep.pages[0]?.headings.find((h) => h.length > 8 && h.length < 120);
  if (h1) {
    return h1.replace(/\s*[-|·].*$/i, "").trim();
  }
  const city = business.city;
  switch (branch) {
    case "makelaar":
      return `Uw partner in vastgoed — ${city}`;
    case "auto":
      return `Uw mobiliteitspartner in ${city}`;
    case "horeca":
      return `Welkom bij ${business.name}`;
    case "retail":
      return `Ontdek ${business.name}`;
    case "health":
      return `Zorg met persoonlijke aandacht — ${city}`;
    default:
      return `${business.name} — professioneel & betrouwbaar`;
  }
}

function buildServices(
  deep: DeepScrapeResult,
  copy: BranchCopy,
): { title: string; desc: string }[] {
  const fromScrape = deep.services.slice(0, 4).map((s) => ({
    title: s,
    desc: "Professioneel en persoonlijk — met lokale expertise en heldere communicatie.",
  }));
  return fromScrape.length >= 2 ? fromScrape : copy.defaultServices;
}

function offerCardsHtml(
  items: OfferItem[],
  copy: BranchCopy,
): string {
  return items
    .map(
      (item) => `
        <article class="offer-card">
          <div class="offer-img">${
            item.imageSrc
              ? `<img src="${esc(item.imageSrc)}" alt="" loading="lazy"/>`
              : ""
          }</div>
          <div class="offer-body">
            <span class="offer-badge">${esc(item.badge)}</span>
            <h3>${esc(item.title)}</h3>
            <p class="offer-meta">${esc(item.meta)}</p>
            <p class="offer-price">${esc(item.price)}</p>
            <a href="#" class="offer-link">${esc(copy.aanbodCta)}</a>
          </div>
        </article>`,
    )
    .join("");
}

export function buildUniversalDemoHtml(
  business: Bedrijf,
  deep: DeepScrapeResult,
  demoSlug: string,
  brandOverride: BrandOverride | null,
): string {
  const branch = resolveDemoBranch(business, deep);
  const copy = getBranchCopy(branch);
  const assetBase = `/demos/${demoSlug}`;
  const { brand } = deep;

  const primary = brandOverride?.primaryColor ?? brand.primaryColor;
  const secondary = brandOverride?.secondaryColor ?? brand.secondaryColor;
  const text = brandOverride?.textColor ?? brand.textColor;

  const logoSrc =
    brandOverride?.logoPath ??
    (brand.logoLocalPath
      ? `${assetBase}/${brand.logoLocalPath}`
      : brand.logoUrl ?? "");

  const heroTitle = pickHeroTitle(deep, business, branch);
  const subtitle =
    deep.pages[0]?.metaDescription?.slice(0, 200) ??
    deep.aboutText?.slice(0, 200) ??
    `Modern online concept voor ${business.name} in ${business.city}.`;

  const nav = [
    copy.navAanbod,
    copy.navDiensten,
    "Over ons",
    "Contact",
  ];

  const offers = extractOffers(branch, deep, business, copy, assetBase);
  const heroBg = resolveHeroBackground(deep, assetBase, copy.heroImage);
  const services = buildServices(deep, copy);
  const phone = deep.contact.phones[0] ?? business.phone ?? "";
  const email = deep.contact.emails[0] ?? business.email ?? "";
  const address =
    deep.contact.addresses[0] ?? `${business.address}, ${business.city}`;

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(business.name)} — Modern homepage concept</title>
  <meta name="description" content="${esc(subtitle)}"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --primary: ${primary};
      --secondary: ${secondary};
      --text: ${text};
      --muted: #64748b;
      --bg: #f8fafc;
      --white: #fff;
      --radius: 16px;
      --shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Plus Jakarta Sans", system-ui, sans-serif; color: var(--text); background: var(--bg); line-height: 1.55; }
    .demo-banner { background: linear-gradient(90deg, #7F56D9, #6941C6); color: #fff; text-align: center; padding: 10px 16px; font-size: 13px; font-weight: 600; }
    header { background: var(--white); border-bottom: 1px solid #e8eaed; position: sticky; top: 0; z-index: 100; backdrop-filter: blur(12px); background: rgba(255,255,255,0.92); }
    .wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .header-inner { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 14px 0; }
    .logo img { height: 48px; width: auto; max-width: 260px; object-fit: contain; }
    .logo-text { font-size: 1.2rem; font-weight: 800; color: var(--primary); }
    nav { display: flex; gap: 24px; flex-wrap: wrap; }
    nav a { color: var(--secondary); text-decoration: none; font-weight: 600; font-size: 14px; }
    nav a:hover { color: var(--primary); }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 12px 22px; border-radius: 10px; font-weight: 700; font-size: 14px; text-decoration: none; transition: transform .15s, box-shadow .15s; }
    .btn-primary { background: var(--primary); color: #fff; box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 40%, transparent); }
    .btn-primary:hover { transform: translateY(-2px); }
    .btn-ghost { border: 2px solid rgba(255,255,255,0.9); color: #fff; background: transparent; }
    .hero { position: relative; min-height: 560px; display: flex; align-items: center; overflow: hidden; color: #fff; }
    .hero-bg { position: absolute; inset: 0; background: linear-gradient(120deg, var(--secondary) 0%, #1e293b 50%, var(--primary) 140%); }
    .hero-bg::after { content: ""; position: absolute; inset: 0; background: url("${esc(heroBg)}") center/cover; opacity: 0.42; }
    .hero-inner { position: relative; z-index: 1; padding: 96px 0 72px; max-width: 640px; }
    .hero-badge { display: inline-block; background: rgba(255,255,255,0.12); backdrop-filter: blur(8px); padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 18px; border: 1px solid rgba(255,255,255,0.2); }
    .hero h1 { font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 800; line-height: 1.08; letter-spacing: -0.03em; }
    .hero p { margin-top: 18px; font-size: 1.1rem; opacity: 0.92; max-width: 520px; }
    .hero-actions { margin-top: 28px; display: flex; gap: 12px; flex-wrap: wrap; }
    .stats { background: var(--white); margin-top: -40px; position: relative; z-index: 2; border-radius: var(--radius); box-shadow: var(--shadow); display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #eef0f3; }
    .stat { padding: 24px 16px; text-align: center; border-right: 1px solid #eef0f3; }
    .stat:last-child { border-right: 0; }
    .stat strong { display: block; font-size: 1.6rem; font-weight: 800; color: var(--primary); }
    .stat span { font-size: 12px; color: var(--muted); font-weight: 600; margin-top: 4px; display: block; }
    section { padding: 80px 0; }
    .section-head { margin-bottom: 40px; }
    .section-head h2 { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 800; color: var(--secondary); letter-spacing: -0.02em; }
    .section-head p { margin-top: 10px; color: var(--muted); max-width: 540px; font-size: 1.02rem; }
    .offers { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 22px; }
    .offer-card { background: var(--white); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); border: 1px solid #eef0f3; transition: transform .2s, box-shadow .2s; }
    .offer-card:hover { transform: translateY(-4px); box-shadow: 0 20px 48px rgba(15,23,42,0.12); }
    .offer-img { height: 188px; background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%); overflow: hidden; }
    .offer-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .offer-body { padding: 20px; }
    .offer-badge { display: inline-block; background: color-mix(in srgb, var(--primary) 12%, white); color: var(--primary); font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; margin-bottom: 8px; letter-spacing: 0.04em; }
    .offer-body h3 { font-size: 1.05rem; font-weight: 700; color: var(--secondary); }
    .offer-meta { font-size: 13px; color: var(--muted); margin-top: 4px; }
    .offer-price { margin-top: 10px; font-size: 1.2rem; font-weight: 800; color: var(--primary); }
    .offer-link { display: inline-block; margin-top: 12px; font-weight: 700; font-size: 13px; color: var(--secondary); text-decoration: none; }
    .offer-link:hover { color: var(--primary); }
    .services { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 18px; }
    .service { background: var(--white); padding: 28px; border-radius: var(--radius); box-shadow: var(--shadow); border: 1px solid #eef0f3; border-top: 3px solid var(--primary); }
    .service h3 { font-size: 1.05rem; font-weight: 700; color: var(--secondary); margin-bottom: 8px; }
    .service p { font-size: 14px; color: var(--muted); }
    .trust-band { background: var(--secondary); color: #fff; border-radius: var(--radius); padding: 48px 40px; display: flex; align-items: center; justify-content: space-between; gap: 28px; flex-wrap: wrap; }
    .trust-band h2 { font-size: 1.6rem; font-weight: 800; }
    .trust-band p { margin-top: 8px; opacity: 0.88; max-width: 480px; font-size: 15px; }
    .trust-badge { font-size: 2rem; font-weight: 900; letter-spacing: 0.06em; opacity: 0.85; }
    .cta { text-align: center; padding: 64px 32px; background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 75%, #000)); border-radius: var(--radius); color: #fff; }
    .cta h2 { font-size: clamp(1.4rem, 3vw, 1.85rem); font-weight: 800; }
    .cta p { margin: 12px auto 24px; max-width: 460px; opacity: 0.95; font-size: 15px; }
    .cta .btn { background: var(--white); color: var(--primary); }
    footer { background: var(--secondary); color: #cbd5e1; padding: 52px 0 28px; }
    .footer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 28px; }
    footer strong { color: #fff; display: block; margin-bottom: 10px; font-size: 14px; }
    footer a { color: #e2e8f0; text-decoration: none; }
    footer a:hover { color: var(--primary); }
    .footer-logo img { height: 40px; margin-bottom: 12px; }
    @media (max-width: 900px) {
      nav { display: none; }
      .stats { grid-template-columns: repeat(2, 1fr); margin-top: -24px; }
      .stat:nth-child(2) { border-right: 0; }
      .hero { min-height: 460px; }
    }
  </style>
</head>
<body>
  <div class="demo-banner">Concept homepage door Proceda — huisstijl &amp; logo van ${esc(business.name)}</div>
  <header>
    <div class="wrap header-inner">
      <a class="logo" href="#">
        ${
          logoSrc
            ? `<img src="${esc(logoSrc)}" alt="${esc(business.name)}"/>`
            : `<span class="logo-text">${esc(business.name)}</span>`
        }
      </a>
      <nav>
        <a href="#aanbod">${esc(copy.navAanbod)}</a>
        <a href="#diensten">${esc(copy.navDiensten)}</a>
        ${nav.slice(2).map((n) => `<a href="#">${esc(n)}</a>`).join("")}
      </nav>
      <a class="btn btn-primary" href="#contact">${esc(copy.ctaButton)}</a>
    </div>
  </header>

  <section class="hero">
    <div class="hero-bg"></div>
    <div class="wrap hero-inner">
      <span class="hero-badge">${esc(copy.heroBadge)} · ${esc(business.city)}</span>
      <h1>${esc(heroTitle)}</h1>
      <p>${esc(subtitle)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#aanbod">${esc(copy.heroCtaPrimary)}</a>
        <a class="btn btn-ghost" href="#contact">${esc(copy.heroCtaSecondary)}</a>
      </div>
    </div>
  </section>

  <div class="wrap">
    <div class="stats">
      ${copy.stats
        .map(
          (s) =>
            `<div class="stat"><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`,
        )
        .join("")}
    </div>
  </div>

  <section id="aanbod">
    <div class="wrap">
      <div class="section-head">
        <h2>${esc(copy.aanbodTitle)}</h2>
        <p>${esc(copy.aanbodSubtitle)}</p>
      </div>
      <div class="offers">${offerCardsHtml(offers, copy)}</div>
    </div>
  </section>

  <section id="diensten" style="background: var(--white);">
    <div class="wrap">
      <div class="section-head">
        <h2>${esc(copy.servicesTitle)}</h2>
        <p>${esc(copy.servicesSubtitle)}</p>
      </div>
      <div class="services">
        ${services
          .map(
            (s) =>
              `<article class="service"><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p></article>`,
          )
          .join("")}
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="trust-band">
        <div>
          <h2>${esc(copy.trustTitle)}</h2>
          <p>${esc(copy.trustBody)}</p>
        </div>
        <div class="trust-badge">${esc(copy.trustBadge)}</div>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="cta">
        <h2>${esc(copy.ctaTitle)}</h2>
        <p>${esc(copy.ctaBody)}</p>
        <a class="btn" href="#contact">${esc(copy.ctaButton)}</a>
      </div>
    </div>
  </section>

  <footer id="contact">
    <div class="wrap footer-grid">
      <div>
        ${
          logoSrc
            ? `<div class="footer-logo"><img src="${esc(logoSrc)}" alt=""/></div>`
            : `<strong>${esc(business.name)}</strong>`
        }
        <p>${esc(address)}</p>
      </div>
      <div>
        <strong>Contact</strong>
        ${phone ? `<p><a href="tel:${esc(phone)}">${esc(phone)}</a></p>` : ""}
        ${email ? `<p><a href="mailto:${esc(email)}">${esc(email)}</a></p>` : ""}
      </div>
      <div>
        <strong>Proceda concept</strong>
        <p style="font-size:13px;margin-top:8px;opacity:0.85">
          <a href="/nl/demos/${esc(demoSlug)}/app" style="color:${esc(primary)};font-weight:700">→ Bekijk ook het dashboard-concept</a>
        </p>
      </div>
    </div>
  </footer>
</body>
</html>`;
}
