export type FundaOfficeRef = {
  numId: string;
  name: string;
  url: string;
  uuid: string;
};

function deref(payload: unknown[], index: unknown): unknown {
  if (typeof index === "number" && index >= 0 && index < payload.length) {
    return payload[index];
  }
  return index;
}

/** Extract makelaar offices (id + UUID) from Funda __NUXT_DATA__ SSR payload. */
export function extractOfficesFromNuxtHtml(html: string): FundaOfficeRef[] {
  const match = html.match(
    /<script type="application\/json" data-nuxt-data="nuxt-app"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (!match) return [];

  let payload: unknown[];
  try {
    payload = JSON.parse(match[1]) as unknown[];
  } catch {
    return [];
  }

  const offices = new Map<string, FundaOfficeRef>();

  for (let i = 0; i < payload.length; i++) {
    const item = payload[i];
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;

    const rec = item as Record<string, unknown>;
    if (!("office_id" in rec) || !("relative_url" in rec)) continue;

    const uuid = deref(payload, rec.office_id);
    const url = deref(payload, rec.relative_url);
    const name = deref(payload, rec.name);
    const numId = deref(payload, rec.id);

    if (
      typeof uuid !== "string" ||
      !uuid.includes("-") ||
      typeof url !== "string" ||
      !url.includes("/makelaar/")
    ) {
      continue;
    }

    const id = String(numId ?? url.match(/\/makelaar\/(\d+)-/)?.[1] ?? "");
    if (!id) continue;

    offices.set(id, {
      numId: id,
      name: typeof name === "string" ? name.trim() : `Makelaar ${id}`,
      url,
      uuid,
    });
  }

  const jsonStr = match[1];
  const re =
    /"([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})","(\/makelaar\/\d+-[^"]+\/)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(jsonStr)) !== null) {
    const uuid = m[1];
    const url = m[2];
    const numId = url.match(/\/makelaar\/(\d+)-/)?.[1];
    if (!numId || offices.has(numId)) continue;
    offices.set(numId, {
      numId,
      name: `Makelaar ${numId}`,
      url,
      uuid,
    });
  }

  return [...offices.values()];
}
