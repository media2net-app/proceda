"use client";

import { useMemo, useState } from "react";
import { useMakelaarPortal } from "./MakelaarPortalContext";
import {
  DemoPageHeader,
  DemoSearchBar,
  FilterChip,
  useDemoAction,
} from "./demo-ui";

const DOC_ICON: Record<string, string> = {
  pdf: "📄",
  doc: "📝",
  image: "🖼️",
};

export default function MakelaarDossiersContent() {
  const { brand, data } = useMakelaarPortal();
  const primary = brand.primaryColor;
  const { run, Toast } = useDemoAction();
  const [tab, setTab] = useState<"docs" | "seller">("docs");
  const [search, setSearch] = useState("");
  const [checklists, setChecklists] = useState(data.sellerChecklists);

  const filteredDocs = useMemo(() => {
    const q = search.toLowerCase();
    return data.documents.filter(
      (d) =>
        !search ||
        d.name.toLowerCase().includes(q) ||
        d.listingAddress.toLowerCase().includes(q),
    );
  }, [data.documents, search]);

  const selectedChecklist = checklists[0];

  return (
    <>
      {Toast}
      <DemoPageHeader
        brand={brand}
        title="Dossiers"
        subtitle="Documenten per woning en verkoper-portaal voortgang"
        action={
          <button
            type="button"
            onClick={() => run("Document geüpload (demo)")}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs"
            style={{ backgroundColor: primary }}
          >
            + Document uploaden
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip
          label="Documenten"
          active={tab === "docs"}
          onClick={() => setTab("docs")}
          primaryColor={primary}
        />
        <FilterChip
          label="Verkoper-portaal"
          active={tab === "seller"}
          onClick={() => setTab("seller")}
          primaryColor={primary}
        />
      </div>

      {tab === "docs" ? (
        <>
          <DemoSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Zoek document of woning…"
          />
          <div className="overflow-x-auto rounded-xl border border-[#EAECF0] bg-white shadow-xs">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[#EAECF0] bg-[#F9FAFB] text-xs text-[#667085]">
                <tr>
                  <th className="px-4 py-3 font-medium">Bestand</th>
                  <th className="px-4 py-3 font-medium">Woning</th>
                  <th className="px-4 py-3 font-medium">Grootte</th>
                  <th className="px-4 py-3 font-medium">Datum</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-[#EAECF0] last:border-b-0 hover:bg-[#F9FAFB]"
                  >
                    <td className="px-4 py-3">
                      <span className="mr-2">{DOC_ICON[doc.type]}</span>
                      <span className="font-medium text-[#101828]">{doc.name}</span>
                    </td>
                    <td className="px-4 py-3 text-[#475467]">{doc.listingAddress}</td>
                    <td className="px-4 py-3 text-[#667085]">{doc.size}</td>
                    <td className="px-4 py-3 text-[#667085]">{doc.uploadedAt}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => run(`Download ${doc.name}`)}
                        className="text-sm font-semibold hover:underline"
                        style={{ color: primary }}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {checklists.map((cl) => (
              <button
                key={cl.listingId}
                type="button"
                onClick={() =>
                  setChecklists((prev) => {
                    const idx = prev.findIndex((c) => c.listingId === cl.listingId);
                    if (idx <= 0) return prev;
                    const next = [...prev];
                    [next[0], next[idx]] = [next[idx]!, next[0]!];
                    return next;
                  })
                }
                className={`w-full rounded-xl border bg-white p-4 text-left shadow-xs transition-shadow hover:shadow-md ${
                  selectedChecklist?.listingId === cl.listingId
                    ? "border-[#FDBA74] ring-1 ring-[#E85B2B]/30"
                    : "border-[#EAECF0]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#101828]">{cl.address}</p>
                    <p className="text-xs text-[#667085]">{cl.sellerName}</p>
                  </div>
                  <span
                    className="text-lg font-bold"
                    style={{ color: primary }}
                  >
                    {cl.progressPct}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F2F4F7]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cl.progressPct}%`, backgroundColor: primary }}
                  />
                </div>
              </button>
            ))}
          </div>

          {selectedChecklist && (
            <div className="rounded-xl border border-[#EAECF0] bg-white p-5 shadow-xs">
              <h3 className="text-base font-semibold text-[#101828]">
                Verkoper-portaal — {selectedChecklist.address}
              </h3>
              <p className="mt-1 text-sm text-[#667085]">
                {selectedChecklist.sellerName} · NVM-vragenlijst & documenten
              </p>
              <ul className="mt-4 space-y-2">
                {selectedChecklist.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-[#EAECF0] bg-[#F9FAFB] px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => {
                        setChecklists((prev) =>
                          prev.map((cl) => {
                            if (cl.listingId !== selectedChecklist.listingId) return cl;
                            const items = cl.items.map((i) =>
                              i.id === item.id ? { ...i, done: !i.done } : i,
                            );
                            return {
                              ...cl,
                              items,
                              progressPct: Math.round(
                                (items.filter((i) => i.done).length / items.length) * 100,
                              ),
                            };
                          }),
                        );
                        run("Verkoper-item bijgewerkt");
                      }}
                      className="h-4 w-4 rounded border-[#D0D5DD]"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        item.done ? "text-[#98A2B3] line-through" : "text-[#344054]"
                      }`}
                    >
                      {item.label}
                      {item.required && (
                        <span className="ml-1 text-[#B42318]">*</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => run("Uitnodiging verkoper-portaal verstuurd")}
                className="mt-4 w-full rounded-lg py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: primary }}
              >
                Herinnering sturen
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
