/** Client-only: lead info na succesvol laden van /demo/{token}. */

export const DEMO_LEAD_SESSION_KEY = "proceda_demo_lead";

export type DemoLeadSession = {
  token: string;
  businessName: string;
};

export function storeDemoLeadSession(lead: DemoLeadSession): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DEMO_LEAD_SESSION_KEY, JSON.stringify(lead));
    window.dispatchEvent(new Event("proceda-demo-lead"));
  } catch {
    /* ignore */
  }
}

export function readDemoLeadSession(): DemoLeadSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DEMO_LEAD_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoLeadSession;
    if (!parsed?.token?.trim() || !parsed?.businessName?.trim()) return null;
    return {
      token: parsed.token.trim(),
      businessName: parsed.businessName.trim(),
    };
  } catch {
    return null;
  }
}

export function clearDemoLeadSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DEMO_LEAD_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
