"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminVertical } from "@/context/AdminVerticalContext";
import { useAutopilot } from "@/context/AutopilotContext";
import type { AdminVerticalHubRow } from "@/lib/admin/vertical-summary-types";
import type { OutreachBranchId } from "@/lib/bedrijven/outreach-branches";

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <dt className="admin-vertical-stat-label truncate">{label}</dt>
      <dd className="admin-vertical-stat-value font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function LeadProgress({
  current,
  target,
  label,
}: {
  current: number;
  target: number;
  label: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const done = current >= target;
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between gap-1 text-[10px]">
        <span className="admin-vertical-muted">{label}</span>
        <span
          className={`font-semibold tabular-nums ${done ? "text-[#6CE9A6]" : "admin-vertical-stat-value"}`}
        >
          {current}/{target}
        </span>
      </div>
      <div className="admin-vertical-progress-track h-1 overflow-hidden rounded-full">
        <div
          className={`h-full rounded-full transition-all ${done ? "bg-[#12B76A]" : "bg-[#7F56D9]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function VerticalCard({
  row,
  active,
  onSelect,
  t,
}: {
  row: AdminVerticalHubRow;
  active: boolean;
  onSelect: () => void;
  t: ReturnType<typeof useTranslations<"adminVertical">>;
}) {
  const planned = row.status === "planned";
  const isPilot = row.id === "installatie" || row.id === "vastgoedbeheer";

  return (
    <article
      className={`admin-vertical-card flex flex-col rounded-lg border p-3 shadow-xs transition ${
        planned
          ? "admin-vertical-card--planned"
          : active
            ? "admin-vertical-card--active"
            : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="admin-vertical-title truncate text-sm font-semibold">{row.name}</h3>
          <div className="mt-0.5 flex flex-wrap gap-1">
            {planned ? (
              <>
                <span className="admin-vertical-badge-muted rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
                  {t("plannedBadge")}
                </span>
              </>
            ) : null}
            {isPilot && row.id === "installatie" ? (
              <span className="admin-vertical-badge-pilot rounded-full px-1.5 py-0.5 text-[9px] font-semibold">
                {t("pilot")}
              </span>
            ) : null}
            {isPilot && row.id === "vastgoedbeheer" ? (
              <span className="admin-vertical-badge-next rounded-full px-1.5 py-0.5 text-[9px] font-semibold">
                {t("newVertical")}
              </span>
            ) : null}
          </div>
        </div>
        {!planned ? (
          <button
            type="button"
            onClick={onSelect}
            className={`admin-vertical-select shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold ${
              active ? "admin-vertical-select--active" : ""
            }`}
          >
            {active ? t("active") : t("select")}
          </button>
        ) : null}
      </div>

      <LeadProgress
        current={row.withEmail}
        target={row.leadTarget}
        label={t("leadGoal")}
      />

      <dl className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1.5">
        <StatCell label={t("businesses")} value={row.businessCount} />
        <StatCell label={t("withEmail")} value={row.withEmail} />
        <StatCell label={t("mailConcept")} value={planned ? 0 : row.mail.concept} />
        <StatCell label={t("mailSent")} value={planned ? 0 : row.mail.sent} />
        <StatCell label={t("followupReady")} value={planned ? 0 : row.mail.followupReady} />
      </dl>

      {!planned ? (
        <div className="admin-vertical-links mt-2 flex flex-wrap gap-1 border-t pt-2">
          <Link href="/dashboard-admin/bedrijven" className="admin-vertical-link admin-vertical-link--primary">
            {t("goBedrijven")}
          </Link>
          <Link href="/dashboard-admin/mail" className="admin-vertical-link admin-vertical-link--primary">
            {t("goMail")}
          </Link>
        </div>
      ) : (
        <p className="admin-vertical-planned-hint mt-2 border-t border-dashed pt-2 text-[10px] leading-snug">
          {t("plannedCardHint")}
        </p>
      )}
    </article>
  );
}

export function AdminVerticalHub() {
  const t = useTranslations("adminVertical");
  const { vertical, setVertical } = useAdminVertical();
  const { active: autopilotActive } = useAutopilot();
  const [rows, setRows] = useState<AdminVerticalHubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const load = useCallback(async () => {
    const showSpinner = rowsRef.current.length === 0;
    if (showSpinner) setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/verticals", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { rows: AdminVerticalHubRow[] };
        setRows(data.rows ?? []);
      } else {
        setLoadError(`HTTP ${res.status}`);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "load_failed");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  if (loading && rows.length === 0) {
    return <p className="admin-vertical-muted text-sm">{t("loading")}</p>;
  }

  if (loadError && rows.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-[#B42318]">{t("loadFailed")}</p>
        <button type="button" onClick={() => void load()} className="admin-vertical-select rounded-lg px-3 py-1.5 text-xs font-semibold">
          {t("retry")}
        </button>
      </div>
    );
  }

  const activeRows = rows.filter((r) => r.status === "active");
  const plannedRows = rows.filter((r) => r.status === "planned");

  return (
    <div className="admin-vertical-hub space-y-4">
      <div>
        <h2 className="admin-vertical-heading text-lg font-semibold">{t("hubTitle")}</h2>
        <p className="admin-vertical-muted mt-1 text-sm">{t("hubSubtitle")}</p>
      </div>

      <div
        className={`admin-vertical-grid grid grid-cols-1 gap-3 sm:grid-cols-2 ${
          autopilotActive ? "lg:grid-cols-2 2xl:grid-cols-3" : "xl:grid-cols-3"
        }`}
      >
        {activeRows.map((row) => (
          <VerticalCard
            key={row.id}
            row={row}
            active={vertical === row.id}
            onSelect={() => setVertical(row.id as OutreachBranchId)}
            t={t}
          />
        ))}
        {plannedRows.map((row) => (
          <VerticalCard key={row.id} row={row} active={false} onSelect={() => {}} t={t} />
        ))}
      </div>
    </div>
  );
}
