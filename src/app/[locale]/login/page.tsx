"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("login");
  const [email, setEmail] = useState("demo@proceda.ai");
  const [password, setPassword] = useState("Pr0ceda!2026#Secure");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#F9FAFB] px-4 py-12">
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
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#101828] transition-opacity hover:opacity-90">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7F56D9] text-sm font-bold text-white">P</span>
            Proceda
          </Link>
        </div>

        <div className="rounded-2xl border border-[#EAECF0] bg-white p-8 shadow-lg sm:p-10">
          <h1 className="mb-1 text-2xl font-semibold text-[#101828]">{t("welcome")}</h1>
          <p className="mb-8 text-sm text-[#667085]">{t("subtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#344054]">
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
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#344054]">
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
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-[#475467]">
                <input type="checkbox" className="h-4 w-4 rounded border-[#D0D5DD] text-[#7F56D9] focus:ring-[#7F56D9]/20" />
                {t("remember")}
              </label>
              <Link href="#" className="font-medium text-[#6941C6] transition-colors hover:text-[#7F56D9]">
                {t("forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#7F56D9] py-3.5 font-semibold text-white shadow-xs transition-all hover:bg-[#6941C6] focus:outline-none focus:ring-4 focus:ring-[#7F56D9]/20"
            >
              {t("submit")}
            </button>
          </form>

          <div className="mt-5 rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-4 py-3 text-xs text-[#667085]">
            {t("demoHint")}
          </div>

          <p className="mt-6 text-center text-sm text-[#667085]">
            {t("noAccount")}{" "}
            <Link href="#" className="font-medium text-[#6941C6] hover:text-[#7F56D9]">
              {t("contact")}
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#98A2B3]">{t("tagline")}</p>
      </div>
    </div>
  );
}
