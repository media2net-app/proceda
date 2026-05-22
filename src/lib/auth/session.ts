import { cookies } from "next/headers";
import type { AuthUser } from "./users";
import { findUserByCredentials } from "./users";
import { SESSION_COOKIE } from "./constants";

export type SessionUser = {
  email: string;
  name: string;
  role: AuthUser["role"];
};

function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64url");
}

export function decodeSession(value: string): SessionUser | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf-8"),
    ) as SessionUser;
    if (parsed.email && parsed.name && parsed.role === "admin") return parsed;
    return null;
  } catch {
    return null;
  }
}

function toSessionUser(user: AuthUser): SessionUser {
  return {
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function createSession(user: AuthUser): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encodeSession(toSessionUser(user)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function validateCredentials(
  email: string,
  password: string,
): AuthUser | null {
  return findUserByCredentials(email, password);
}
