export type AuthUser = {
  email: string;
  password: string;
  name: string;
  role: "admin";
};

function adminFromEnv(): AuthUser | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!email || !password) return null;
  return {
    email,
    password,
    name: "Chiel",
    role: "admin",
  };
}

export function findUserByCredentials(
  email: string,
  password: string,
): AuthUser | null {
  const admin = adminFromEnv();
  if (!admin) return null;
  const normalized = email.trim().toLowerCase();
  if (
    normalized === admin.email &&
    password === admin.password
  ) {
    return admin;
  }
  return null;
}

export function getHomePath(): string {
  return "/dashboard-admin";
}
