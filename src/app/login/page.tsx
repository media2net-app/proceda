"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy: direct door naar dashboard
    router.push("/dashboard");
  };

  return (
    <div className="hero-purple-glow flex min-h-screen w-full flex-col items-center justify-center bg-[#1e1b4b] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / branding -zelfde stijl als homepage */}
        <div className="mb-8 flex justify-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-white transition-opacity hover:opacity-90"
          >
            Proceda
          </Link>
        </div>

        {/* Login card - glassmorphism op paarse achtergrond */}
        <div className="card-glass rounded-2xl p-8 sm:p-10">
          <h1 className="mb-1 text-2xl font-semibold text-white">
            Welkom terug
          </h1>
          <p className="mb-8 text-sm text-zinc-400">
            Log in op je account om door te gaan
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="naam@bedrijf.nl"
                className="w-full rounded-xl border border-zinc-600/80 bg-zinc-900/60 px-4 py-3 text-white placeholder-zinc-500 outline-none transition-all focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/20"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-600/80 bg-zinc-900/60 px-4 py-3 text-white placeholder-zinc-500 outline-none transition-all focus:border-[#a855f7] focus:ring-2 focus:ring-[#a855f7]/20"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-zinc-400">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-[#a855f7] focus:ring-[#a855f7]/30"
                />
                Onthoud mij
              </label>
              <Link
                href="#"
                className="text-[#a855f7] transition-colors hover:text-[#c084fc]"
              >
                Wachtwoord vergeten?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#a855f7] py-3.5 font-medium text-white shadow-lg shadow-[#a855f7]/25 transition-all hover:bg-[#9333ea] hover:shadow-[#a855f7]/35 focus:outline-none focus:ring-2 focus:ring-[#a855f7] focus:ring-offset-2 focus:ring-offset-[#0c0c0f]"
            >
              Inloggen
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Nog geen account?{" "}
            <Link
              href="#"
              className="font-medium text-[#a855f7] hover:text-[#c084fc]"
            >
              Neem contact op
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Maatwerk webapplicaties voor jouw bedrijf
        </p>
      </div>
    </div>
  );
}
