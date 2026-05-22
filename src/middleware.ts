import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { decodeSession } from "@/lib/auth/session";

const intlMiddleware = createMiddleware(routing);
const LOCALES = routing.locales;

function stripLocale(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (
    parts.length > 0 &&
    LOCALES.includes(parts[0] as (typeof LOCALES)[number])
  ) {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname;
}

function localeFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (
    parts.length > 0 &&
    LOCALES.includes(parts[0] as (typeof LOCALES)[number])
  ) {
    return parts[0];
  }
  return routing.defaultLocale;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const path = stripLocale(pathname);
  const locale = localeFromPath(pathname);

  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const session = sessionToken ? decodeSession(sessionToken) : null;

  const isLogin = path === "/login";
  const isAdminArea =
    path === "/dashboard-admin" || path.startsWith("/dashboard-admin/");
  const isLegacyDashboard =
    path === "/dashboard" || path.startsWith("/dashboard/");

  if (isLogin && session) {
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard-admin`, request.url),
    );
  }

  if (isAdminArea && !session) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("from", path);
    return NextResponse.redirect(loginUrl);
  }

  if (isLegacyDashboard) {
    if (session) {
      return NextResponse.redirect(
        new URL(`/${locale}/dashboard-admin`, request.url),
      );
    }
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
