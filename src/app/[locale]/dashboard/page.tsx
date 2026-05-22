import { getTranslations } from "next-intl/server";
import DashboardLayout from "@/components/DashboardLayout";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const revenuePoints = "0,82 8,74 16,70 24,62 32,58 40,46 48,40 56,34 64,28 72,24 80,18 88,14 96,10";
  const ticketPoints = "0,24 8,30 16,32 24,36 32,40 40,44 48,48 56,50 64,56 72,60 80,63 88,66 96,70";
  const usersPoints = "0,64 8,61 16,59 24,55 32,53 40,48 48,46 56,40 64,36 72,34 80,28 88,24 96,20";
  const deals = [
    {
      name: "Northwind BV",
      segment: t("segmentEnterprise"),
      value: "EUR 94,000",
      stage: t("dealStageNegotiation"),
      status: t("dealStatusCustomer"),
      usage: 78,
    },
    {
      name: "Blueport Logistics",
      segment: t("segmentMidMarket"),
      value: "EUR 51,000",
      stage: t("dealStageProposal"),
      status: t("dealStatusChurned"),
      usage: 54,
    },
    {
      name: "Altura Retail",
      segment: t("segmentSmb"),
      value: "EUR 28,500",
      stage: t("dealStageQualified"),
      status: t("dealStatusCustomer"),
      usage: 64,
    },
    {
      name: "Nexa Manufacturing",
      segment: t("segmentEnterprise"),
      value: "EUR 123,000",
      stage: t("dealStageDiscovery"),
      status: t("dealStatusNew"),
      usage: 37,
    },
  ];
  const activities = [t("activity1"), t("activity2"), t("activity3"), t("activity4")];
  const tasks = [
    { title: t("task1"), status: t("statusToday"), done: false },
    { title: t("task2"), status: t("statusToday"), done: false },
    { title: t("task3"), status: t("statusThisWeek"), done: true },
    { title: t("task4"), status: t("statusThisWeek"), done: false },
  ];
  const statusStyles: Record<string, string> = {
    [t("dealStatusChurned")]: "bg-[#FEF3F2] text-[#B42318]",
    [t("dealStatusNew")]: "bg-[#F9F5FF] text-[#6941C6]",
    [t("dealStatusCustomer")]: "bg-[#ECFDF3] text-[#027A48]",
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#101828]">{t("title")}</h1>
          <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-[#D0D5DD] bg-white px-4 py-2 text-sm font-medium text-[#344054] shadow-xs hover:bg-[#F9FAFB]"
          >
            {t("import")}
          </button>
          <button
            type="button"
            className="rounded-lg bg-[#7F56D9] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#6941C6]"
          >
            {t("add")}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 basis-full items-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 shadow-xs sm:min-w-[220px] sm:basis-auto">
            <svg className="h-4 w-4 shrink-0 text-[#98A2B3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={t("searchPlaceholder")}
              readOnly
              className="w-full min-w-0 bg-transparent text-sm text-[#667085] outline-none"
              aria-label={t("searchAria")}
            />
          </div>
          <button type="button" className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#344054] shadow-xs hover:bg-[#F9FAFB]">
            {t("today")}
          </button>
          <button type="button" className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#344054] shadow-xs hover:bg-[#F9FAFB]">
            {t("last7Days")}
          </button>
          <button type="button" className="whitespace-nowrap rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#344054] shadow-xs hover:bg-[#F9FAFB]">
            {t("dateRange")}
          </button>
          <button type="button" className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#344054] shadow-xs hover:bg-[#F9FAFB] sm:ml-auto">
            {t("filters")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: t("totalCustomers"), value: "2,420", trend: "+40%", points: revenuePoints, color: "#7F56D9" },
          { label: t("members"), value: "1,210", trend: "-10%", points: usersPoints, color: "#F04438" },
          { label: t("activeNow"), value: "316", trend: "+20%", points: ticketPoints, color: "#7F56D9" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <p className="text-sm font-medium text-[#667085]">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[#101828]">{item.value}</p>
            <p className={`mt-1 text-sm ${item.trend.startsWith("-") ? "text-[#F04438]" : "text-[#12B76A]"}`}>
              {item.trend} <span className="text-[#667085]">{t("vsLastMonth")}</span>
            </p>
            <div className="mt-4 h-12">
              <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
                <polyline points={item.points} fill="none" stroke={item.color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#101828]">{t("revenueTrend")}</h2>
            <span className="text-xs text-[#667085]">{t("last12Weeks")}</span>
          </div>
          <div className="mt-4 h-44 rounded-lg bg-[#F9FAFB] p-3">
            <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
              <polyline points={revenuePoints} fill="none" stroke="#7F56D9" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>

        <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
          <h2 className="text-base font-semibold text-[#101828]">{t("supportBacklog")}</h2>
          <div className="mt-4 h-44 rounded-lg bg-[#F9FAFB] p-3">
            <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
              <polyline points={ticketPoints} fill="none" stroke="#F04438" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#101828]">{t("companies")}</h2>
            <span className="text-xs text-[#667085]">{t("realtimeSync")}</span>
          </div>
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#EAECF0] text-xs text-[#667085]">
                  <th className="pb-3 font-medium">{t("colCompany")}</th>
                  <th className="pb-3 font-medium">{t("colLicenseUse")}</th>
                  <th className="pb-3 font-medium">{t("colStatus")}</th>
                  <th className="pb-3 font-medium">{t("colUsers")}</th>
                  <th className="pb-3 font-medium">{t("colAbout")}</th>
                  <th className="pb-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => (
                  <tr key={deal.name} className="border-b border-[#EAECF0] last:border-b-0">
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-[#101828]">{deal.name}</p>
                        <p className="text-xs text-[#667085]">{deal.segment.toLowerCase()}.io</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-[#F2F4F7]">
                        <div className="h-full rounded-full bg-[#7F56D9]" style={{ width: `${deal.usage}%` }} />
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[deal.status] ?? "bg-[#ECFDF3] text-[#027A48]"}`}>
                        {deal.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex -space-x-2">
                        {["SK", "LP", "ED"].map((initials, i) => (
                          <div
                            key={initials}
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#F2F4F7] text-xs font-medium text-[#475467]"
                            style={{ zIndex: 3 - i }}
                          >
                            {initials}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 text-xs text-[#667085]">
                      {deal.stage} — {deal.value}
                    </td>
                    <td className="py-4 text-right">
                      <button type="button" className="rounded p-1 text-[#98A2B3] hover:bg-[#F2F4F7] hover:text-[#475467]" aria-label="•••">
                        •••
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <h2 className="text-base font-semibold text-[#101828]">{t("activityFeed")}</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#475467]">
              {activities.map((item) => (
                <li key={item} className="rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <h2 className="text-base font-semibold text-[#101828]">{t("teamTasks")}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {tasks.map((task) => (
                <li key={task.title} className="flex items-center justify-between gap-2 rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-3 py-2">
                  <span className={`min-w-0 ${task.done ? "text-[#98A2B3] line-through" : "text-[#344054]"}`}>{task.title}</span>
                  <span className="shrink-0 text-xs text-[#667085]">{task.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
