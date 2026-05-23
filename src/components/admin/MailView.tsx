"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import { useMailSync } from "@/context/MailSyncContext";
import { InboxPanel } from "./InboxPanel";
import { AdminLeadTimeline } from "./AdminLeadTimeline";
import { AdminLeadInboxThread } from "./AdminLeadInboxThread";
import type {
  MailAccountStatus,
  MailKpiStats,
  MailTemplatePreview,
} from "@/lib/mail/types";

type StatusFilter =
  | "all"
  | "draft"
  | "sent"
  | "booked"
  | "clicked"
  | "followup";

function isFollowupPoolLead(x: MailTemplatePreview): boolean {
  return (
    x.status === "sent" &&
    !!x.demoVisited &&
    !x.followupSentAt &&
    !!x.followupHtmlBody
  );
}

export function MailView() {
  const t = useTranslations("adminMail");
  const locale = useLocale();
  const { vertical, verticalLabel } = useAdminVertical();

  const [templates, setTemplates] = useState<MailTemplatePreview[]>([]);
  const [stats, setStats] = useState<MailKpiStats | null>(null);
  const mailSync = useMailSync();
  const [account, setAccount] = useState<MailAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("draft");
  const [tab, setTab] = useState<"outreach" | "inbox" | "sent">("outreach");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingSlug, setSendingSlug] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("info@media2net.nl");
  const [testCompany, setTestCompany] = useState("Test company");

  const loadAccount = useCallback(async () => {
    try {
      const res = await fetch("/api/mail/account");
      setAccount((await res.json()) as MailAccountStatus);
    } catch {
      setAccount({ configured: false });
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/mail?locale=${locale}&branch=${encodeURIComponent(vertical)}`,
      );
      const data = (await res.json()) as {
        templates: MailTemplatePreview[];
        stats: MailKpiStats;
      };
      const list = data.templates ?? [];
      setTemplates(list);
      setStats(data.stats ?? null);
      setSelectedSlug((prev) => {
        if (prev && list.some((x) => x.slug === prev)) return prev;
        return list[0]?.slug ?? null;
      });
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [locale, vertical, t]);

  useEffect(() => {
    loadAccount();
    load();
  }, [load, loadAccount]);

  const followupPool = useMemo(
    () => templates.filter(isFollowupPoolLead),
    [templates],
  );

  useEffect(() => {
    if (statusFilter !== "followup" || followupPool.length === 0) return;
    setSelectedSlug((prev) => {
      if (prev && followupPool.some((x) => x.slug === prev)) return prev;
      return followupPool[0]?.slug ?? null;
    });
  }, [statusFilter, followupPool]);

  const filtered = useMemo(() => {
    let list = templates;
    if (statusFilter === "followup") {
      list = followupPool;
    } else if (statusFilter === "clicked") {
      list = list.filter(
        (x) =>
          (x.status === "sent" || x.status === "booked") && x.demoVisited,
      );
    } else if (statusFilter !== "all") {
      list = list.filter((x) => x.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (x) =>
        x.businessName.toLowerCase().includes(q) ||
        x.city.toLowerCase().includes(q) ||
        (x.email?.toLowerCase().includes(q) ?? false) ||
        x.subject.toLowerCase().includes(q),
    );
  }, [templates, search, statusFilter, followupPool]);

  const selected = useMemo(
    () => filtered.find((x) => x.slug === selectedSlug) ?? filtered[0] ?? null,
    [filtered, selectedSlug],
  );

  const previewMail = useMemo(() => {
    if (!selected) return null;
    if (statusFilter === "followup" && selected.followupHtmlBody) {
      return {
        subject: selected.followupSubject ?? selected.subject,
        htmlBody: selected.followupHtmlBody,
        plainBody: selected.followupPlainBody ?? selected.plainBody,
        variant: "followup" as const,
      };
    }
    return {
      subject: selected.subject,
      htmlBody: selected.htmlBody,
      plainBody: selected.plainBody,
      variant: "initial" as const,
    };
  }, [selected, statusFilter]);

  async function copyHtml(item: MailTemplatePreview) {
    const html =
      statusFilter === "followup" && item.followupHtmlBody
        ? item.followupHtmlBody
        : item.htmlBody;
    await navigator.clipboard.writeText(html);
    setCopiedId(item.businessId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function sendMail(
    item: MailTemplatePreview,
    opts?: { email?: string; businessName?: string; testMode?: boolean },
  ) {
    const to = opts?.email?.trim() || item.email?.trim();
    if (!to) return;
    setSendingSlug(item.slug);
    setError(null);
    try {
      const res = await fetch(`/api/mail/send?locale=${locale}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          slug: item.slug,
          email: to,
          businessName: opts?.businessName?.trim(),
          testMode: opts?.testMode,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        const err = data.error ?? t("sendError");
        if (err === "MAIL_NOT_CONFIGURED") throw new Error(t("notConfigured"));
        if (err === "ALREADY_SENT") throw new Error(t("alreadySent"));
        throw new Error(err);
      }
      if (!opts?.testMode) {
        await load();
        await mailSync.syncNow();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("sendError"));
    } finally {
      setSendingSlug(null);
    }
  }

  async function sendFollowup(
    item: MailTemplatePreview,
    opts?: { email?: string; businessName?: string; testMode?: boolean },
  ) {
    const to = opts?.email?.trim() || item.email?.trim();
    if (!to) return;
    setSendingSlug(item.slug);
    setError(null);
    try {
      const res = await fetch(`/api/mail/send-followup?locale=${locale}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({
          slug: item.slug,
          email: to,
          businessName: opts?.businessName?.trim(),
          testMode: opts?.testMode,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        const err = data.error ?? t("sendError");
        if (err === "MAIL_NOT_CONFIGURED") throw new Error(t("notConfigured"));
        if (err === "FOLLOWUP_ALREADY_SENT") throw new Error(t("followupAlreadySent"));
        if (err === "ALREADY_BOOKED") throw new Error(t("alreadyBooked"));
        throw new Error(err);
      }
      if (!opts?.testMode) {
        await load();
        await mailSync.syncNow();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("sendError"));
    } finally {
      setSendingSlug(null);
    }
  }

  const statusStyle = (status: MailTemplatePreview["status"]) => {
    if (status === "booked") return "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]";
    if (status === "sent") return "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]";
    return "bg-[#F2F4F7] text-[#475467] border-[#EAECF0]";
  };

  const accountOk =
    account?.configured && account.smtpOk && account.imapOk;

  const sentMailCount = mailSync.messages.filter(
    (m) => m.direction === "outbound",
  ).length;

  return (
    <div className="max-w-full space-y-8 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-semibold text-[#101828]">
          {t("title")} · {verticalLabel}
        </h1>
        <p className="mt-1 text-sm text-[#667085]">{t("subtitleDemo")}</p>
      </div>

      <div
        className={`rounded-xl border p-4 text-sm ${
          accountOk
            ? "border-[#ABEFC6] bg-[#ECFDF3] text-[#027A48]"
            : "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]"
        }`}
      >
        {accountOk ? (
          <p>
            <span className="font-semibold">{t("accountConnected")}</span> —{" "}
            {account?.from}
          </p>
        ) : account?.configured ? (
          <p>
            <span className="font-semibold">{t("accountError")}</span>{" "}
            {account?.error ?? t("accountPartial")}
          </p>
        ) : (
          <p>{t("notConfigured")}</p>
        )}
      </div>

      <div className="rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] p-4">
        <p className="text-sm font-semibold text-[#6941C6]">{t("testSendTitle")}</p>
        <p className="mt-1 text-xs text-[#667085]">
          {statusFilter === "followup" ? t("testSendHintFollowup") : t("testSendHint")}
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-medium text-[#344054]">
            {t("testSendEmail")}
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#101828]"
            />
          </label>
          <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-xs font-medium text-[#344054]">
            {t("testSendCompany")}
            <input
              type="text"
              value={testCompany}
              onChange={(e) => setTestCompany(e.target.value)}
              className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm text-[#101828]"
            />
          </label>
          <button
            type="button"
            disabled={!selected || !accountOk || sendingSlug !== null}
            onClick={() => {
              if (!selected) return;
              const args = {
                email: testEmail,
                businessName: testCompany,
                testMode: true,
              };
              if (statusFilter === "followup") sendFollowup(selected, args);
              else sendMail(selected, args);
            }}
            className="rounded-lg border border-[#7F56D9] bg-white px-4 py-2 text-sm font-semibold text-[#6941C6] hover:bg-[#F4EBFF] disabled:opacity-60"
          >
            {sendingSlug ? t("sending") : t("testSendButton")}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
          <KpiCard
            label={t("kpiConcept")}
            value={stats.readyToSend}
            sub={t("kpiConceptSub", { pool: stats.demoReadyPool })}
            accent
          />
          <KpiCard label={t("kpiSent")} value={stats.sent} />
          <KpiCard label={t("kpiBooked")} value={stats.booked} />
          <KpiCard
            label={t("kpiConversion")}
            value={`${stats.conversionSentToBooked}%`}
            sub={t("kpiConversionSub")}
          />
          <KpiCard
            label={t("kpiDemoClicks")}
            value={stats.demoClicked}
            sub={t("kpiDemoClicksSub", { rate: stats.demoClickRate })}
          />
          <KpiCard
            label={t("kpiFollowupReady")}
            value={stats.followupReady}
            sub={t("kpiFollowupReadySub")}
            accent={stats.followupReady > 0}
          />
          <KpiCard
            label={t("kpiReplies")}
            value={stats.inboxInbound}
            sub={
              stats.inboxUnread > 0
                ? t("kpiUnread", { count: stats.inboxUnread })
                : undefined
            }
          />
        </div>
      )}

      <div className="scrollbar-hide-x -mx-1 flex gap-1 border-b border-[#EAECF0] px-1 pb-px sm:flex-wrap sm:gap-2">
        <TabButton active={tab === "outreach"} onClick={() => setTab("outreach")}>
          {t("tabOutreach")} ({templates.length})
        </TabButton>
        <TabButton active={tab === "inbox"} onClick={() => setTab("inbox")}>
          {t("tabInbox")}
          {mailSync.unread > 0 && (
            <span className="ml-1.5 rounded-full bg-[#7F56D9] px-1.5 py-0.5 text-[10px] text-white">
              {mailSync.unread}
            </span>
          )}
        </TabButton>
        <TabButton active={tab === "sent"} onClick={() => setTab("sent")}>
          {t("tabSent")} ({sentMailCount})
        </TabButton>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
        >
          {error}
        </p>
      )}

      {tab === "inbox" ? (
        <InboxPanel direction="inbound" />
      ) : tab === "sent" ? (
        <InboxPanel direction="outbound" />
      ) : (
        <>
          <div className="rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] p-4 text-sm text-[#475467]">
            <p className="font-semibold text-[#6941C6]">{t("sendListTitle")}</p>
            <p className="mt-1">{t("sendListBody")}</p>
            <p className="mt-2 text-xs text-[#667085]">{t("hintScreenshots")}</p>
          </div>

          {statusFilter === "followup" && (
            <div className="rounded-xl border border-[#FEDF89] bg-[#FFFAEB] p-4 text-sm text-[#7A2E0E]">
              <p className="font-semibold text-[#B54708]">{t("followupBannerTitle")}</p>
              <p className="mt-1">{t("followupBannerBody", { count: followupPool.length })}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="scrollbar-hide-x -mx-1 flex gap-2 px-1 pb-0.5">
              {(
                ["draft", "sent", "booked", "clicked", "followup", "all"] as const
              ).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`filter-pill shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    statusFilter === f
                      ? "bg-[#7F56D9] text-white"
                      : "bg-[#F2F4F7] text-[#475467] hover:bg-[#EAECF0]"
                  }`}
                >
                  {t(`filter_${f}`)} (
                  {f === "all"
                    ? templates.length
                    : f === "clicked"
                      ? templates.filter(
                          (x) =>
                            (x.status === "sent" || x.status === "booked") &&
                            x.demoVisited,
                        ).length
                      : f === "followup"
                        ? followupPool.length
                        : templates.filter((x) => x.status === f).length}
                  )
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("search")}
                className="min-w-[220px] flex-1 rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm shadow-xs focus:border-[#7F56D9] focus:outline-none focus:ring-2 focus:ring-[#F4EBFF] lg:max-w-xs"
              />
              <button
                type="button"
                onClick={load}
                className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB]"
              >
                {t("refresh")}
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[#667085]">{t("loading")}</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] p-8 text-center">
              <p className="text-sm text-[#667085]">{t("empty")}</p>
              <p className="mt-2 text-xs text-[#98A2B3]">{t("emptyHint")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(280px,360px)_1fr] lg:items-start">
              <ul
                className={`scroll-touch max-h-[min(70dvh,520px)] space-y-2 overflow-y-auto rounded-xl border border-[#EAECF0] bg-white p-2 shadow-xs lg:max-h-[calc(100dvh-320px)] ${
                  selected ? "hidden lg:block" : "block"
                }`}
              >
                {filtered.map((item) => {
                  const active = selected?.slug === item.slug;
                  return (
                    <li key={item.businessId}>
                      <button
                        type="button"
                        onClick={() => setSelectedSlug(item.slug)}
                        className={`flex w-full gap-3 rounded-lg border p-3 text-left transition ${
                          active
                            ? "border-[#7F56D9] bg-[#F9F5FF] ring-1 ring-[#7F56D9]/30"
                            : "border-transparent hover:bg-[#F9FAFB]"
                        }`}
                      >
                        <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded border border-[#EAECF0] bg-white">
                          {item.logoPath ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.logoPath}
                              alt=""
                              className="max-h-8 max-w-[52px] object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-[#98A2B3]">—</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-[#101828]">
                              {item.businessName}
                            </span>
                            <span
                              className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${statusStyle(item.status)}`}
                            >
                              {t(`status.${item.status}`)}
                            </span>
                            {item.demoVisited ? (
                              <span className="shrink-0 rounded-full border border-[#FEDF89] bg-[#FFFAEB] px-1.5 py-0.5 text-[10px] font-semibold text-[#B54708]">
                                {t("demoClickedBadge")}
                              </span>
                            ) : null}
                            {item.emailGuessed ? (
                              <span className="shrink-0 rounded-full border border-[#FCCEEE] bg-[#FDF2FA] px-1.5 py-0.5 text-[10px] font-semibold text-[#C11574]">
                                {t("guessedEmailBadge")}
                              </span>
                            ) : null}
                            {item.status === "draft" && item.sendReady === false ? (
                              <span
                                className="shrink-0 rounded-full border border-[#FEDF89] bg-[#FFFAEB] px-1.5 py-0.5 text-[10px] font-semibold text-[#B54708]"
                                title={item.sendBlockers?.join(", ")}
                              >
                                {t("sendNotReadyBadge")}
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-[#667085]">
                            {item.email ?? t("noEmail")}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-[#98A2B3]">
                            {statusFilter === "followup" && item.followupSubject
                              ? item.followupSubject
                              : item.subject}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {selected ? (
                <div className="min-w-0 rounded-xl border border-[#EAECF0] bg-white shadow-sm lg:sticky lg:top-24">
                  <div className="border-b border-[#EAECF0] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedSlug(null)}
                        className="filter-pill mb-1 w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-left text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7] lg:hidden"
                      >
                        ← {t("backToList")}
                      </button>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-[#101828]">
                          {selected.businessName}
                        </h2>
                        <p className="text-sm text-[#667085]">
                          {selected.city} · {selected.email}
                        </p>
                        <p className="mt-2 text-sm font-medium text-[#344054]">
                          {previewMail?.variant === "followup"
                            ? t("followupSubjectLabel")
                            : t("subjectLabel")}
                          : {previewMail?.subject ?? selected.subject}
                        </p>
                        {previewMail?.variant === "followup" ? (
                          <p className="mt-1 text-xs text-[#6941C6]">
                            {t("followupPreviewNote")}
                          </p>
                        ) : null}
                        {selected.demoVisited ? (
                          <p className="mt-2 text-sm text-[#B54708]">
                            {t("demoClickDetail", {
                              count: selected.demoClickCount ?? 0,
                              sessions: selected.demoSessionCount ?? 0,
                              last: selected.demoLastClickAt
                                ? new Date(
                                    selected.demoLastClickAt,
                                  ).toLocaleString("nl-NL", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })
                                : "—",
                            })}
                          </p>
                        ) : selected.status === "sent" ||
                          selected.status === "booked" ? (
                          <p className="mt-2 text-sm text-[#667085]">
                            {t("demoNotClickedYet")}
                          </p>
                        ) : null}
                        {selected.status === "draft" &&
                        selected.sendReady === false &&
                        selected.sendBlockers?.length ? (
                          <p className="mt-3 rounded-lg border border-[#FEDF89] bg-[#FFFAEB] px-3 py-2 text-xs text-[#B54708]">
                            {t("sendNotReadyHint", {
                              blockers: selected.sendBlockers.join(" · "),
                            })}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={selected.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-[#D6BBFB] bg-[#F9F5FF] px-3 py-1.5 text-xs font-semibold text-[#6941C6]"
                        >
                          {t("openBookingPage")}
                        </a>
                        <button
                          type="button"
                          onClick={() => copyHtml(selected)}
                          className="rounded-lg border border-[#D6BBFB] bg-white px-3 py-1.5 text-xs font-semibold text-[#6941C6]"
                        >
                          {copiedId === selected.businessId ? t("copied") : t("copyHtml")}
                        </button>
                        {selected.status === "draft" && selected.email && (
                          <button
                            type="button"
                            disabled={
                              sendingSlug === selected.slug ||
                              !accountOk ||
                              selected.sendReady === false
                            }
                            title={
                              selected.sendReady === false
                                ? selected.sendBlockers?.join(", ")
                                : undefined
                            }
                            onClick={() => sendMail(selected)}
                            className="rounded-lg bg-[#7F56D9] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6941C6] disabled:opacity-60"
                          >
                            {sendingSlug === selected.slug ? t("sending") : t("sendMail")}
                          </button>
                        )}
                        {statusFilter === "followup" &&
                          isFollowupPoolLead(selected) &&
                          selected.email && (
                            <button
                              type="button"
                              disabled={sendingSlug === selected.slug || !accountOk}
                              onClick={() => sendFollowup(selected)}
                              className="rounded-lg bg-[#B54708] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#93370D] disabled:opacity-60"
                            >
                              {sendingSlug === selected.slug
                                ? t("sending")
                                : t("sendFollowup")}
                            </button>
                          )}
                      </div>
                    </div>
                    <AdminLeadTimeline businessId={selected.businessId} />
                    <AdminLeadInboxThread email={selected.email} />
                  </div>
                  <div className="bg-[#F9FAFB] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
                      {previewMail?.variant === "followup"
                        ? t("followupPreviewHtml")
                        : t("previewHtml")}
                    </p>
                    <div
                      className="mt-3 overflow-hidden rounded-lg border border-[#EAECF0] bg-white"
                      dangerouslySetInnerHTML={{
                        __html: previewMail?.htmlBody ?? selected.htmlBody,
                      }}
                    />
                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs font-semibold text-[#6941C6]">
                        {t("plainText")}
                      </summary>
                      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-[#EAECF0] bg-white p-3 text-sm text-[#344054]">
                        {previewMail?.plainBody ?? selected.plainBody}
                      </pre>
                    </details>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors sm:py-2 ${
        active
          ? "border-[#7F56D9] text-[#6941C6]"
          : "border-transparent text-[#667085] hover:text-[#344054]"
      }`}
    >
      {children}
    </button>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-xs ${
        accent ? "border-[#7F56D9] bg-[#F9F5FF]" : "border-[#EAECF0] bg-white"
      }`}
    >
      <p className="text-xs font-semibold uppercase text-[#667085]">{label}</p>
      <p
        className={`mt-2 text-3xl font-bold ${accent ? "text-[#7F56D9]" : "text-[#101828]"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-[#667085]">{sub}</p>}
    </div>
  );
}
