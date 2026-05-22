import { NextResponse } from "next/server";
import { BRANCHES, BRANCH_IDS } from "@/lib/bedrijven/branches";
import { listBranchesWithData } from "@/lib/bedrijven/branches-data";

export async function GET() {
  const withData = await listBranchesWithData();
  const byId = new Map(withData.map((b) => [b.id, b]));

  const branches = BRANCH_IDS.map((id) => ({
    id,
    name: BRANCHES[id].name,
    totalCount: byId.get(id)?.totalCount ?? 0,
    provincesWithData: byId.get(id)?.provinces ?? 0,
  }));

  return NextResponse.json({ branches });
}
