import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { demoHomepagePublicPath } from "@/lib/bedrijven/demo-slug";

type RouteContext = {
  params: Promise<{ locale: string; slug: string }>;
};

function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug);
}

function absolutizeAssetPaths(html: string, slug: string): string {
  return html
    .replace(/src="assets\//g, `src="/demos/${slug}/assets/`)
    .replace(/href="assets\//g, `href="/demos/${slug}/assets/`);
}

export async function GET(_request: Request, context: RouteContext) {
  const { locale, slug } = await context.params;

  if (!isSafeSlug(slug)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "demos", slug, "index.html");

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const html = absolutizeAssetPaths(raw, slug);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "NOT_FOUND",
        hint: `Genereer eerst een volledig rapport. Verwacht pad: ${demoHomepagePublicPath(slug, locale)}`,
      },
      { status: 404 },
    );
  }
}
