import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="bg-proceda-gradient min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-white"
          >
            <span className="text-[#a855f7]">Proceda</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">Demo gebruiker</span>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Uitloggen
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-8 text-2xl font-semibold text-white">
          Dashboard
        </h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card-glass rounded-2xl p-6">
            <h2 className="mb-1 text-sm font-medium text-zinc-400">
              Projecten
            </h2>
            <p className="text-3xl font-bold text-white">0</p>
            <p className="mt-2 text-xs text-zinc-500">Actieve projecten</p>
          </div>
          <div className="card-glass rounded-2xl p-6">
            <h2 className="mb-1 text-sm font-medium text-zinc-400">
              Klanten
            </h2>
            <p className="text-3xl font-bold text-white">0</p>
            <p className="mt-2 text-xs text-zinc-500">Geregistreerde klanten</p>
          </div>
          <div className="card-glass rounded-2xl p-6">
            <h2 className="mb-1 text-sm font-medium text-zinc-400">
              Taken
            </h2>
            <p className="text-3xl font-bold text-white">0</p>
            <p className="mt-2 text-xs text-zinc-500">Openstaande taken</p>
          </div>
        </div>

        <div className="mt-8">
          <div className="card-glass rounded-2xl p-6">
            <h2 className="mb-4 text-lg font-medium text-white">
              Welkom op je dashboard
            </h2>
            <p className="text-zinc-400">
              Dit is een dummy dashboard. Je bent hier gekomen na inloggen op de
              loginpagina. Hier kun je later overzichten, projecten en
              instellingen toevoegen.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
