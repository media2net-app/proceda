"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { BRANCHES, type ScrapeBranchId } from "@/lib/bedrijven/branches";
import { AUTOPILOT_PIPELINE_BRANCH_IDS } from "@/lib/bedrijven/autopilot-pipeline-branches";
import type { OutreachBranchId } from "@/lib/bedrijven/outreach-branches";
import type { MailTemplateSample } from "@/lib/mail/build-template-sample";
import { useMailAdminUrl } from "./use-mail-admin-url";

type TemplateKind = "initial" | "followup";

export function MailTemplatesView() {
  const t = useTranslations("adminMailTemplates");
  const locale = useLocale();
  const { branchFromUrl, setUrl } = useMailAdminUrl();
  const [branch, setBranch] = useState<OutreachBranchId>(() => {
    if (
      branchFromUrl &&
      AUTOPILOT_PIPELINE_BRANCH_IDS.includes(branchFromUrl as OutreachBranchId)
    ) {
      return branchFromUrl as OutreachBranchId;
    }
    return "makelaardij";
  });
  const [kind, setKind] = useState<TemplateKind>("initial");
  const [sample, setSample] = useState<MailTemplateSample | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        locale,
        branch,
        kind,
      });
      const res = await fetch(`/api/mail/template-sample?${params}`);
      if (!res.ok) throw new Error("load_failed");
      const data = (await res.json()) as { sample: MailTemplateSample };
      setSample(data.sample);
    } catch {
      setError(t("loadError"));
      setSample(null);
    } finally {
      setLoading(false);
    }
  }, [locale, branch, kind, t]);

  useEffect(() => {
    if (
      branchFromUrl &&
      AUTOPILOT_PIPELINE_BRANCH_IDS.includes(branchFromUrl as OutreachBranchId)
    ) {
      setBranch(branchFromUrl as OutreachBranchId);
    }
  }, [branchFromUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  function selectBranch(id: OutreachBranchId) {
    setBranch(id);
    setUrl({ branch: id });
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#101828]">{t("title")}</h1>
          <p className="mt-1 text-sm text-[#667085]">{t("subtitle")}</p>
        </div>
        <Link
          href="/dashboard-admin/mail"
          className="rounded-lg border border-[#D0D5DD] bg-white px-4 py-2 text-sm font-semibold text-[#344054] shadow-xs hover:bg-[#F9FAFB]"
        >
          {t("backToMail")} →
        </Link>
      </div>

      <div className="rounded-xl border border-[#FEDF89] bg-[#FFFAEB] p-4 text-sm text-[#7A2E0E]">
        <p className="font-semibold text-[#B54708]">{t("fixNoteTitle")}</p>
        <p className="mt-1">{t("fixNoteBody")}</p>
      </div>

      <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
        <p className="text-sm font-semibold text-[#101828]">{t("branchLabel")}</p>
        <div className="scrollbar-hide-x -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-0.5">
          {AUTOPILOT_PIPELINE_BRANCH_IDS.map((id) => {
            const active = branch === id;
            const label = BRANCHES[id as ScrapeBranchId]?.name ?? id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectBranch(id)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "border-[#7F56D9] bg-[#F9F5FF] text-[#6941C6]"
                    : "border-[#EAECF0] bg-[#F9FAFB] text-[#344054] hover:border-[#D6BBFB]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["initial", "followup"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              kind === k
                ? "bg-[#7F56D9] text-white"
                : "bg-[#F2F4F7] text-[#475467] hover:bg-[#EAECF0]"
            }`}
          >
            {t(`kind_${k}`)}
          </button>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-[#B42318]">{error}</p>
      ) : loading ? (
        <p className="text-sm text-[#667085]">{t("loading")}</p>
      ) : sample ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
              {t("subjectLabel")}
            </p>
            <p className="mt-2 text-base font-medium text-[#101828]">{sample.subject}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#667085]">
              {t("sampleNameLabel")}
            </p>
            <p className="mt-1 text-sm text-[#344054]">{sample.businessName}</p>
          </div>

          <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#667085]">
              {t("htmlPreview")}
            </p>
            <div
              className="admin-mail-html-preview mt-3 overflow-hidden rounded-lg border border-[#EAECF0] bg-[#F9FAFB] p-4"
              dangerouslySetInnerHTML={{ __html: sample.htmlBody }}
            />
          </div>

          <details className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <summary className="cursor-pointer text-sm font-semibold text-[#6941C6]">
              {t("plainDraft")}
            </summary>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-sm text-[#344054]">
              {sample.proposalDraft}
            </pre>
          </details>

          <details className="rounded-xl border border-[#D6BBFB] bg-[#F9F5FF] p-5">
            <summary className="cursor-pointer text-sm font-semibold text-[#6941C6]">
              {t("sourceHint")}
            </summary>
            <p className="mt-2 text-xs text-[#667085]">{t("sourcePath")}</p>
          </details>
        </div>
      ) : null}
    </div>
  );
}
