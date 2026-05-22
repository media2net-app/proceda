"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMailSync } from "@/context/MailSyncContext";
import type { InboxMessage } from "@/lib/mail/types";

type MailDirectionFilter = "inbound" | "outbound";

export function InboxPanel({
  direction = "inbound",
}: {
  direction?: MailDirectionFilter;
}) {
  const t = useTranslations("adminMail");
  const mail = useMailSync();
  const [search, setSearch] = useState("");
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [readUids, setReadUids] = useState<Set<number>>(() => new Set());

  const directionMessages = useMemo(
    () => mail.messages.filter((m) => m.direction === direction),
    [mail.messages, direction],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = directionMessages;
    if (!q) return list;
    return list.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.from.toLowerCase().includes(q) ||
        m.to.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q),
    );
  }, [directionMessages, search]);

  const selected =
    filtered.find((m) => m.uid === selectedUid) ??
    directionMessages.find((m) => m.uid === selectedUid) ??
    null;

  useEffect(() => {
    setSelectedUid(null);
    setReadUids(new Set());
  }, [direction]);

  useEffect(() => {
    if (filtered.length > 0 && selectedUid === null) {
      setSelectedUid(filtered[0]!.uid);
    }
  }, [filtered, selectedUid]);

  function openMessage(msg: InboxMessage) {
    setSelectedUid(msg.uid);
    setReadUids((prev) => new Set(prev).add(msg.uid));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            direction === "outbound" ? t("sentSearch") : t("inboxSearch")
          }
          className="w-full max-w-md rounded-lg border border-[#D0D5DD] px-3 py-2 text-sm shadow-xs focus:border-[#7F56D9] focus:outline-none focus:ring-2 focus:ring-[#F4EBFF]"
        />
        <div className="flex shrink-0 items-center gap-3 text-xs text-[#667085]">
          {mail.syncing ? (
            <span className="font-medium text-[#6941C6]">{t("syncing")}</span>
          ) : mail.syncedAt ? (
            <span className="whitespace-nowrap">
              {t("lastSync")}: {new Date(mail.syncedAt).toLocaleString()}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => mail.syncNow()}
            disabled={mail.syncing || !mail.configured}
            className="whitespace-nowrap rounded-lg border border-[#D0D5DD] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] disabled:opacity-50"
          >
            {t("syncNow")}
          </button>
        </div>
      </div>

      <p className="text-xs text-[#98A2B3]">{t("autoSyncNote")}</p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D0D5DD] bg-[#F9FAFB] p-8 text-center">
          <p className="text-sm text-[#667085]">{t("inboxEmpty")}</p>
        </div>
      ) : (
        <div className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-[#EAECF0] bg-white shadow-xs lg:flex-row">
          {/* Lijst */}
          <div
            className={`flex w-full shrink-0 flex-col border-[#EAECF0] lg:w-[300px] lg:border-r xl:w-[340px] ${
              selectedUid !== null ? "hidden lg:flex" : "flex"
            }`}
          >
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {filtered.map((msg) => {
                const isSelected = selectedUid === msg.uid;
                const unread =
                  direction === "inbound" &&
                  !msg.seen &&
                  !readUids.has(msg.uid);
                return (
                  <li key={`${msg.uid}-${msg.messageId}`} className="border-b border-[#EAECF0] last:border-b-0">
                    <button
                      type="button"
                      onClick={() => openMessage(msg)}
                      className={`block w-full p-3 text-left transition-colors hover:bg-[#F9FAFB] sm:p-4 ${
                        isSelected ? "bg-[#F9F5FF] ring-1 ring-inset ring-[#D6BBFB]" : unread ? "bg-[#FAFAFF]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="mb-1 flex flex-wrap items-center gap-1">
                            <span
                              className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
                                msg.direction === "inbound"
                                  ? "border-[#ABEFC6] bg-[#ECFDF3] text-[#027A48]"
                                  : "border-[#B2DDFF] bg-[#EFF8FF] text-[#175CD3]"
                              }`}
                            >
                              {msg.direction === "inbound"
                                ? t("directionIn")
                                : t("directionOut")}
                            </span>
                            {unread && (
                              <span className="shrink-0 text-[10px] font-bold text-[#7F56D9]">
                                {t("unread")}
                              </span>
                            )}
                          </div>
                          <p
                            className={`truncate text-sm leading-snug ${
                              unread ? "font-bold text-[#101828]" : "font-medium text-[#344054]"
                            }`}
                            title={msg.subject}
                          >
                            {msg.subject}
                          </p>
                          <p
                            className="mt-0.5 truncate text-xs text-[#667085]"
                            title={direction === "outbound" ? msg.to : msg.from}
                          >
                            {direction === "outbound"
                              ? `${t("to")}: ${msg.to || "—"}`
                              : msg.from}
                          </p>
                          {msg.preview && (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#98A2B3]">
                              {msg.preview}
                            </p>
                          )}
                        </div>
                        <time className="shrink-0 pt-0.5 text-[10px] leading-none text-[#98A2B3]">
                          {new Date(msg.date).toLocaleDateString("nl-NL", {
                            day: "numeric",
                            month: "short",
                          })}
                        </time>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Detail */}
          <div
            className={`min-w-0 flex-1 flex-col overflow-hidden ${
              selectedUid !== null ? "flex" : "hidden lg:flex"
            }`}
          >
            {selected ? (
              <MessageDetail
                message={selected}
                onBack={() => setSelectedUid(null)}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-[#667085]">
                {t("selectMessage")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageDetail({
  message,
  onBack,
}: {
  message: InboxMessage;
  onBack: () => void;
}) {
  const t = useTranslations("adminMail");

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#EAECF0] bg-[#F9FAFB] px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 shrink-0 rounded-lg border border-[#D0D5DD] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#344054] hover:bg-[#F2F4F7] lg:hidden"
          >
            ← {t("closeMessage")}
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-base font-semibold leading-snug text-[#101828] sm:text-lg">
              {message.subject}
            </h2>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex flex-wrap gap-x-2">
                <dt className="shrink-0 font-medium text-[#344054]">{t("from")}:</dt>
                <dd className="min-w-0 break-all text-[#667085]">{message.from}</dd>
              </div>
              {message.to && (
                <div className="flex flex-wrap gap-x-2">
                  <dt className="shrink-0 font-medium text-[#344054]">{t("to")}:</dt>
                  <dd className="min-w-0 break-all text-[#667085]">{message.to}</dd>
                </div>
              )}
              <div>
                <dd className="text-xs text-[#98A2B3]">
                  {new Date(message.date).toLocaleString("nl-NL")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto bg-white">
        <div className="email-body-container mx-auto max-w-full p-4 sm:p-6">
          {message.bodyHtml ? (
            <div
              className="email-body-html"
              dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
            />
          ) : message.bodyText ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#344054]">
              {message.bodyText}
            </pre>
          ) : message.preview ? (
            <p className="text-sm leading-relaxed text-[#475467]">{message.preview}</p>
          ) : (
            <p className="text-sm text-[#667085]">{t("noBody")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
