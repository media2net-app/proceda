import { NextResponse } from "next/server";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";

/** Lightweight list for dropdowns (all provinces). */
export async function GET() {
  const businesses = await loadAllBusinesses();
  return NextResponse.json({
    businesses: businesses.map((b) => ({
      id: b.id,
      name: b.name,
      email: b.email,
      phone: b.phone,
      city: b.city,
      province: b.province,
    })),
  });
}
