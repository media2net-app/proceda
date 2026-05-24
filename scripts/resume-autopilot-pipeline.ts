import { config } from "dotenv";

config();
config({ path: ".env.local" });

async function main() {
  const secret = process.env.CRON_SECRET ?? process.env.AUTOPILOT_CRON_SECRET;
  const base =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  if (!secret) {
    console.error(
      "Zet CRON_SECRET of AUTOPILOT_CRON_SECRET in .env.local (zelfde als Vercel cron).",
    );
    process.exit(1);
  }

  const res = await fetch(`${base}/api/admin/outreach/autopilot/tick?cron=1`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  const body = await res.json();
  console.log(res.status, JSON.stringify(body, null, 2));
  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
