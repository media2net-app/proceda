/** Client-side: bookingActive = gebruiker vult demo-afspraakformulier in. */

export const BOOKING_ENGAGED_SESSION_KEY = "proceda_booking_engaged";
export const BOOKING_ENGAGED_EVENT = "proceda-booking-engaged";

export function isDemoBookingPath(path: string): boolean {
  const p = path.split("?")[0].toLowerCase();
  return /\/demo\/[^/]+/.test(p);
}

export function markBookingFormEngaged(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BOOKING_ENGAGED_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(BOOKING_ENGAGED_EVENT));
}

export function clearBookingFormEngaged(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(BOOKING_ENGAGED_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function isBookingFormEngaged(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(BOOKING_ENGAGED_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function isFormField(el: HTMLElement): boolean {
  if (el.tagName === "TEXTAREA") return true;
  if (el.tagName !== "INPUT") return false;
  const input = el as HTMLInputElement;
  const type = (input.type || "text").toLowerCase();
  if (["hidden", "submit", "button", "image", "file"].includes(type)) {
    return false;
  }
  return true;
}

export function registerBookingFormEngagementListeners(
  pathname: string,
): () => void {
  if (typeof document === "undefined" || !isDemoBookingPath(pathname)) {
    return () => {};
  }

  const onInteraction = (e: Event) => {
    const target = e.target;
    if (!(target instanceof HTMLElement) || !isFormField(target)) return;
    const input = target as HTMLInputElement;
    if (
      e.type === "change" &&
      (input.type === "checkbox" || input.type === "radio")
    ) {
      if (input.checked) markBookingFormEngaged();
      return;
    }
    if (e.type === "input" && input.value.trim().length > 0) {
      markBookingFormEngaged();
    }
  };

  document.addEventListener("input", onInteraction, true);
  document.addEventListener("change", onInteraction, true);
  return () => {
    document.removeEventListener("input", onInteraction, true);
    document.removeEventListener("change", onInteraction, true);
  };
}
