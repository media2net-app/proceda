import { NextResponse } from "next/server";
import { BRANCHES } from "@/lib/bedrijven/branches";
import { loadDemoReadyAudit } from "@/lib/bedrijven/demo-ready-audit";
import { loadAllBusinesses } from "@/lib/bedrijven/load-all-businesses";
import {
  OUTREACH_BRANCH_IDS,
  type OutreachBranchId,
} from "@/lib/bedrijven/outreach-branches";
import { getMailKpiStats } from "@/lib/mail/mail-campaign";

export async function GET() {
  const branches = await Promise.all(
    OUTREACH_BRANCH_IDS.map(async (id) => {
      const [businesses, audit, mail] = await Promise.all([
        loadAllBusinesses(id),
        loadDemoReadyAudit(id),
        getMailKpiStats("nl", undefined, id),
      ]);
      const demoReady = audit?.results.filter((r) => r.demoReady).length ?? 0;
      return {
        id,
        name: BRANCHES[id as OutreachBranchId]?.name ?? id,
        businessCount: businesses.length,
        withEmail: businesses.filter((b) => b.email?.trim()).length,
        demoReady,
        mail: {
          concept: mail.readyToSend,
          sent: mail.sent,
          booked: mail.booked,
          followupReady: mail.followupReady,
          demoClicked: mail.demoClicked,
        },
      };
    }),
  );
  return NextResponse.json({ branches, updatedAt: new Date().toISOString() });
}
