"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

export default function LoginPage() {
  const t = useTranslations("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#1e1b4b] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-white transition-opacity hover:opacity-90">
            Proceda
          </Link>
        </div>

        {/* Card in homepage-stijl: licht op paars */}
        <div className="rounded-2xl border border-white/10 bg-white/95 p-8 shadow-lg backdrop-blur-sm sm:p-10">
          <h1 className="mb-1 text-2xl font-semibold text-zinc-900">{t("welcome")}</h1>
          <p className="mb-8 text-sm text-zinc-600">{t("subtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-700">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-[#1e1b4b] focus:ring-2 focus:ring-[#1e1b4b]/20"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-700">
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-[#1e1b4b] focus:ring-2 focus:ring-[#1e1b4b]/20"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-zinc-600">
                <input type="checkbox" className="h-4 w-4 rounded border-zinc-300 text-[#1e1b4b] focus:ring-[#1e1b4b]/30" />
                {t("remember")}
              </label>
              <Link href="#" className="font-medium text-[#1e1b4b] transition-colors hover:text-[#312e81]">
                {t("forgotPassword")}
              </Link>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#1e1b4b] py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-[#312e81] focus:outline-none focus:ring-2 focus:ring-[#1e1b4b] focus:ring-offset-2 focus:ring-offset-white"
            >
              {t("submit")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            {t("noAccount")}{" "}
            <Link href="#" className="font-medium text-[#1e1b4b] hover:text-[#312e81]">
              {t("contact")}
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-white/70">{t("tagline")}</p>
      </div>
    </div>
  );
}
