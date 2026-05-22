"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { redirect?: string; error?: string };
      if (!res.ok) {
        setError(t("invalidCredentials"));
        return;
      }
      router.push(data.redirect ?? "/dashboard-admin");
      router.refresh();
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-shell relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-x-hidden bg-[#F9FAFB] px-4 py-12 safe-x safe-bottom">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 15% 15%, rgba(127,86,217,0.08), transparent 60%), radial-gradient(ellipse 70% 45% at 85% 85%, rgba(127,86,217,0.06), transparent 60%)",
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#101828] transition-opacity hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7F56D9] text-sm font-bold text-white">
              P
            </span>
            Proceda
          </Link>
        </div>

        <div className="rounded-2xl border border-[#EAECF0] bg-white p-8 shadow-lg sm:p-10">
          <h1 className="mb-1 text-2xl font-semibold text-[#101828]">
            {t("welcome")}
          </h1>
          <p className="mb-8 text-sm text-[#667085]">{t("subtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#344054]"
              >
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-lg border border-[#D0D5DD] bg-white px-4 py-3 text-[#101828] shadow-xs placeholder-[#98A2B3] outline-none transition-all focus:border-[#7F56D9] focus:ring-4 focus:ring-[#7F56D9]/10"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#344054]"
              >
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#D0D5DD] bg-white px-4 py-3 text-[#101828] shadow-xs placeholder-[#98A2B3] outline-none transition-all focus:border-[#7F56D9] focus:ring-4 focus:ring-[#7F56D9]/10"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#7F56D9] py-3.5 font-semibold text-white shadow-xs transition-all hover:bg-[#6941C6] focus:outline-none focus:ring-4 focus:ring-[#7F56D9]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t("submitting") : t("submit")}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#98A2B3]">
            {t("adminOnly")}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#98A2B3]">{t("tagline")}</p>
      </div>
    </div>
  );
}
