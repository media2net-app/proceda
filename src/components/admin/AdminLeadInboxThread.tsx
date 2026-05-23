"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useMailSync } from "@/context/MailSyncContext";

export function AdminLeadInboxThread({ email }: { email?: string }) {
  const t = useTranslations("adminMail");
  const mail = useMailSync();
  const normalized = email?.trim().toLowerCase();

  const thread = useMemo(() => {
    if (!normalized) return [];
    return mail.messages.filter((m) => {
      const from = m.from.toLowerCase();
      const to = m.to.toLowerCase();
      return from.includes(normalized) || to.includes(normalized);
    });
  }, [mail.messages, normalized]);

  if (!normalized) return null;

  return (
    <div className="mt-4 rounded-lg border border-[#EAECF0] bg-white p-4">
      <h3 className="text-sm font-semibold text-[#101828]">{t("inboxThreadTitle")}</h3>
      {thread.length === 0 ? (
        <p className="mt-2 text-xs text-[#98A2B3]">{t("inboxThreadEmpty")}</p>
      ) : (
        <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs">
          {thread.slice(0, 12).map((m) => (
            <li key={m.uid} className="rounded border border-[#F2F4F7] px-2 py-1.5">
              <div className="flex justify-between gap-2 text-[#667085]">
                <span className="font-medium text-[#344054]">
                  {m.direction === "inbound" ? "← In" : "→ Uit"}
                </span>
                <time>{new Date(m.date).toLocaleDateString("nl-NL")}</time>
              </div>
              <p className="truncate font-medium text-[#101828]">{m.subject}</p>
              <p className="truncate text-[#667085]">{m.preview}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
