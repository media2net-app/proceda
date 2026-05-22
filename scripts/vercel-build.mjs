#!/usr/bin/env node
/**
 * Vercel/production build: generate Prisma client, migrate when DATABASE_URL is set, then Next.js.
 */
import { execSync } from "node:child_process";

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: process.env });
}

run("npx prisma generate");

if (process.env.DATABASE_URL?.trim()) {
  run("npx prisma migrate deploy");
} else {
  console.warn(
    "⚠ DATABASE_URL not set — skipping prisma migrate deploy (set it in Vercel for production DB).",
  );
}

run("npx next build");
