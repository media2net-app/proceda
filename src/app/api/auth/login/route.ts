import { NextResponse } from "next/server";
import { createSession, validateCredentials } from "@/lib/auth/session";
import { getHomePath } from "@/lib/auth/users";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = body.email ?? "";
  const password = body.password ?? "";

  const user = validateCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  await createSession(user);
  return NextResponse.json({ ok: true, redirect: getHomePath() });
}
