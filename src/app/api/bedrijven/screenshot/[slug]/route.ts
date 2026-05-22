import fs from "fs/promises";
import { resolveScreenshotFile } from "@/lib/bedrijven/business-report-storage";
import { slugToBusinessId } from "@/lib/bedrijven/slug";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const businessId = slugToBusinessId(slug);
  const file = await resolveScreenshotFile(businessId);

  if (!file) {
    return new Response("Screenshot not found", { status: 404 });
  }

  const buffer = await fs.readFile(file);
  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
