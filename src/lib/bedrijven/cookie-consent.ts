import type { Page } from "puppeteer";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Common CMP / cookie-banner selectors (NL + EN + EU vendors). */
const COOKIE_SELECTORS = [
  "#onetrust-accept-btn-handler",
  "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
  "#CybotCookiebotDialogBodyButtonAccept",
  "button.coi-banner__accept",
  "#cookie-accept",
  "#accept-cookies",
  ".accept-cookies",
  "[data-testid='accept-cookies']",
  ".cmplz-accept",
  ".cc-accept",
  ".cc-allow",
  ".js-cookie-accept",
  "#tarteaucitronPersonalize2",
  ".tarteaucitronAllow",
  "#ppms_cm_agree-to-all-btn",
  "button[id*='accept']",
  "button[class*='accept-all']",
  "button[class*='acceptAll']",
  "a[class*='accept-all']",
  "[data-action='accept']",
  "[data-cookie-accept]",
  ".osano-cm-accept-all",
  "#sp-cc-accept",
  ".fc-cta-consent",
  "button.fc-primary-button",
  ".didomi-continue-without-agreeing",
  "button.didomi-components-button--color",
  "#didomi-notice-agree-button",
];

const ACCEPT_PHRASES = [
  "alles accepteren",
  "accept all",
  "allow all",
  "alle cookies",
  "cookies accepteren",
  "accepteren",
  "akkoord",
  "toestaan",
  "agree",
  "accept",
  "ik ga akkoord",
  "ga akkoord",
  "begrepen",
  "doorgaan",
];

const REJECT_PHRASES = [
  "only necessary",
  "alleen noodzak",
  "weigeren",
  "reject",
  "afwijzen",
  "deny",
  "instellingen",
  "settings",
  "voorkeuren",
  "preferences",
];

async function clickSelector(page: Page, selector: string): Promise<boolean> {
  try {
    const el = await page.$(selector);
    if (!el) return false;
    const box = await el.boundingBox();
    if (!box || box.width < 8 || box.height < 8) return false;
    await el.click();
    return true;
  } catch {
    return false;
  }
}

async function clickByButtonText(page: Page): Promise<boolean> {
  return page.evaluate(
    `((acceptPhrases, rejectPhrases) => {
      const norm = (s) => s.toLowerCase().replace(/\\s+/g, " ").trim();
      const matchesAccept = (text) => acceptPhrases.some((p) => text.includes(p));
      const matchesReject = (text) => rejectPhrases.some((p) => text.includes(p));
      const candidates = Array.from(document.querySelectorAll(
        "button, a, input[type='button'], input[type='submit'], [role='button']"
      ));
      const scored = [];
      for (const el of candidates) {
        const text = norm(el.innerText || el.textContent || el.getAttribute("aria-label") || "");
        if (text.length < 2 || text.length > 55) continue;
        if (matchesReject(text)) continue;
        if (!matchesAccept(text)) continue;
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;
        let score = 10;
        if (text.includes("alles") || text.includes("all")) score += 5;
        scored.push({ el, score });
      }
      scored.sort((a, b) => b.score - a.score);
      if (scored.length === 0) return false;
      scored[0].el.click();
      return true;
    })(${JSON.stringify(ACCEPT_PHRASES)}, ${JSON.stringify(REJECT_PHRASES)})`,
  ) as Promise<boolean>;
}

/**
 * Tries to dismiss cookie/consent overlays before screenshot or DOM read.
 * Returns true if a click was likely performed.
 */
export async function dismissCookieConsent(page: Page): Promise<boolean> {
  await sleep(900);

  for (const selector of COOKIE_SELECTORS) {
    if (await clickSelector(page, selector)) {
      await sleep(700);
      return true;
    }
  }

  if (await clickByButtonText(page)) {
    await sleep(700);
    return true;
  }

  // Second pass — banners often render late
  await sleep(600);
  for (const selector of COOKIE_SELECTORS.slice(0, 12)) {
    if (await clickSelector(page, selector)) {
      await sleep(500);
      return true;
    }
  }

  if (await clickByButtonText(page)) {
    await sleep(500);
    return true;
  }

  return false;
}
