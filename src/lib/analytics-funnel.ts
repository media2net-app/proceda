/** Map URL paths to funnel labels for live analytics (locale-stripped paths). */
export function funnelLabelFromPath(path: string): string | null {
  const p = path.split("?")[0].toLowerCase();
  if (p === "/" || p === "") return "Homepage";
  if (p.includes("/demo/")) return "Demo booking";
  if (p.startsWith("/demos/")) return "Makelaar demo";
  if (p.startsWith("/login")) return "Login";
  if (p.startsWith("/dashboard")) return "Dashboard";
  return null;
}

export function formatTopPageLabel(path: string): string {
  const pathname = path.split("?")[0] || "/";
  const funnel = funnelLabelFromPath(path);
  if (pathname === "/") return "Home · /";
  if (funnel) return `${funnel} · ${pathname}`;
  if (pathname.length > 48) return `${pathname.slice(0, 46)}…`;
  return pathname;
}
