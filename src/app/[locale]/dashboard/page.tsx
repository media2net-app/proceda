import { getTranslations } from "next-intl/server";
import DashboardLayout from "@/components/DashboardLayout";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <DashboardLayout>
      <h1 className="mb-8 text-2xl font-semibold text-white">{t("title")}</h1>

      {/* Stats cards in homepage-stijl: licht op paars */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl">
            <h2 className="mb-1 text-sm font-medium text-zinc-500">{t("projects")}</h2>
            <p className="text-3xl font-bold text-[#1e1b4b]">0</p>
            <p className="mt-2 text-xs text-zinc-600">{t("projectsDesc")}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl">
            <h2 className="mb-1 text-sm font-medium text-zinc-500">{t("clients")}</h2>
            <p className="text-3xl font-bold text-[#1e1b4b]">0</p>
            <p className="mt-2 text-xs text-zinc-600">{t("clientsDesc")}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl">
            <h2 className="mb-1 text-sm font-medium text-zinc-500">{t("tasks")}</h2>
            <p className="text-3xl font-bold text-[#1e1b4b]">0</p>
            <p className="mt-2 text-xs text-zinc-600">{t("tasksDesc")}</p>
          </div>
      </div>

      <div className="mt-8">
        <div className="rounded-2xl border border-white/10 bg-white/95 p-6 shadow-lg backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">{t("welcomeTitle")}</h2>
          <p className="text-zinc-600">{t("welcomeDesc")}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
