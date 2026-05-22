import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ slug: string }> };

/** Redirect oude /demos/{slug} URLs naar gelokaliseerde route. */
export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const url = new URL(request.url);
  url.pathname = `/nl/demos/${slug}`;
  return NextResponse.redirect(url, 308);
}
