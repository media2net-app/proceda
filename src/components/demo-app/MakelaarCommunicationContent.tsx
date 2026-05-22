"use client";

import { useMemo, useState } from "react";
import { useMakelaarPortal } from "./MakelaarPortalContext";
import { DemoPageHeader, DemoSearchBar, useDemoAction } from "./demo-ui";

const TIMELINE_ICON: Record<string, string> = {
  email: "✉️",
  viewing: "📅",
  bid: "💰",
  sync: "🔄",
  document: "📄",
  lead: "👤",
};

export default function MakelaarCommunicationContent() {
  const { brand, data } = useMakelaarPortal();
  const primary = brand.primaryColor;
  const { run, Toast } = useDemoAction();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(data.emails[0]?.id ?? null);
  const [emails, setEmails] = useState(data.emails);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return emails.filter(
      (e) =>
        !search ||
        e.subject.toLowerCase().includes(q) ||
        e.from.toLowerCase().includes(q) ||
        (e.listingAddress?.toLowerCase().includes(q) ?? false),
    );
  }, [emails, search]);

  const selected = emails.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

  return (
    <>
      {Toast}
      <DemoPageHeader
        brand={brand}
        title="E-mail & tijdlijn"
        subtitle={`${emails.filter((e) => !e.read).length} ongelezen · gekoppeld aan leads en woningen`}
        action={
          <button
            type="button"
            onClick={() => run("Nieuw e-mailconcept (demo)")}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs"
            style={{ backgroundColor: primary }}
          >
            + E-mail opstellen
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DemoSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Zoek e-mail…"
          />
          <ul className="space-y-1 rounded-xl border border-[#EAECF0] bg-white shadow-xs">
            {filtered.map((mail) => (
              <li key={mail.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(mail.id);
                    setEmails((prev) =>
                      prev.map((e) =>
                        e.id === mail.id ? { ...e, read: true } : e,
                      ),
                    );
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    selected?.id === mail.id
                      ? "bg-[#FFF4ED]"
                      : "hover:bg-[#F9FAFB]"
                  } ${!mail.read ? "border-l-2" : ""}`}
                  style={
                    !mail.read && selected?.id === mail.id
                      ? { borderLeftColor: primary }
                      : !mail.read
                        ? { borderLeftColor: primary }
                        : undefined
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-sm ${
                        mail.read ? "font-medium text-[#344054]" : "font-semibold text-[#101828]"
                      }`}
                    >
                      {mail.from}
                    </p>
                    <span className="shrink-0 text-[10px] text-[#98A2B3]">{mail.date}</span>
                  </div>
                  <p className="truncate text-xs font-medium text-[#475467]">{mail.subject}</p>
                  <p className="mt-0.5 truncate text-xs text-[#98A2B3]">{mail.preview}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selected && (
            <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
              <h3 className="text-lg font-semibold text-[#101828]">{selected.subject}</h3>
              <p className="mt-1 text-sm text-[#667085]">
                Van {selected.from} → {selected.to} · {selected.date}
              </p>
              {selected.listingAddress && (
                <p className="mt-1 text-xs text-[#475467]">
                  Woning: {selected.listingAddress}
                </p>
              )}
              <p className="mt-4 rounded-lg bg-[#F9FAFB] p-4 text-sm leading-relaxed text-[#344054]">
                {selected.preview}
                <br />
                <br />
                Met vriendelijke groet,
                <br />
                {selected.from}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => run("Antwoord verzonden")}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: primary }}
                >
                  Beantwoorden
                </button>
                <button
                  type="button"
                  onClick={() => run("Doorgestuurd naar dossier")}
                  className="rounded-lg border border-[#D0D5DD] px-4 py-2 text-sm font-medium text-[#344054] hover:bg-[#F9FAFB]"
                >
                  Koppel aan dossier
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
            <h2 className="text-base font-semibold text-[#101828]">Tijdlijn kantoor</h2>
            <ul className="mt-4 space-y-3">
              {data.timeline.map((ev) => (
                <li key={ev.id} className="flex gap-3">
                  <span className="text-lg" aria-hidden>
                    {TIMELINE_ICON[ev.type] ?? "•"}
                  </span>
                  <div className="min-w-0 flex-1 border-b border-[#EAECF0] pb-3 last:border-0">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-[#101828]">{ev.title}</p>
                      <span className="text-xs text-[#98A2B3]">{ev.at}</span>
                    </div>
                    <p className="text-sm text-[#667085]">{ev.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
