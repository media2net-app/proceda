"use client";

import { useMemo, useState } from "react";
import type { DemoAppraisal } from "@/lib/demo-app/types";
import { useMakelaarPortal } from "./MakelaarPortalContext";
import { AgentAvatar, DemoPageHeader, DemoSearchBar, FilterChip } from "./demo-ui";

const STATUS_LABEL: Record<DemoAppraisal["status"], string> = {
  intake: "Intake",
  opname: "Opname",
  rapport: "Rapport",
  opgeleverd: "Opgeleverd",
};

const STATUS_STYLE: Record<DemoAppraisal["status"], string> = {
  intake: "bg-[#FFF4ED] text-[#C4320A]",
  opname: "bg-[#EFF8FF] text-[#175CD3]",
  rapport: "bg-[#F9F5FF] text-[#6941C6]",
  opgeleverd: "bg-[#ECFDF3] text-[#027A48]",
};

export default function MakelaarAppraisalsContent() {
  const { brand, data } = useMakelaarPortal();
  const primary = brand.primaryColor;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DemoAppraisal["status"] | "all">("all");

  const filtered = useMemo(() => {
    return data.appraisals.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        a.address.toLowerCase().includes(q) ||
        a.client.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data.appraisals, search, statusFilter]);

  return (
    <>
      <DemoPageHeader
        brand={brand}
        title="Taxaties"
        subtitle={`${data.appraisals.filter((a) => a.status !== "opgeleverd").length} lopende opdrachten`}
        action={
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs"
            style={{ backgroundColor: primary }}
          >
            + Taxatie-opdracht
          </button>
        }
      />

      <DemoSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Zoek adres of opdrachtgever…"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterChip
          label="Alle"
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
          primaryColor={primary}
        />
        {(Object.keys(STATUS_LABEL) as DemoAppraisal["status"][]).map((s) => (
          <FilterChip
            key={s}
            label={STATUS_LABEL[s]}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
            primaryColor={primary}
          />
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#EAECF0] bg-white shadow-xs">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[#EAECF0] bg-[#F9FAFB] text-xs text-[#667085]">
            <tr>
              <th className="px-4 py-3 font-medium">Adres</th>
              <th className="px-4 py-3 font-medium">Opdrachtgever</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Deadline</th>
              <th className="px-4 py-3 font-medium">Indicatie</th>
              <th className="px-4 py-3 font-medium">Makelaar</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b border-[#EAECF0] last:border-b-0 hover:bg-[#F9FAFB]">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#101828]">{a.address}</p>
                  <p className="text-xs text-[#667085]">{a.city}</p>
                </td>
                <td className="px-4 py-3 text-[#344054]">{a.client}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLE[a.status]
                    }`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#667085]">{a.dueDate}</td>
                <td className="px-4 py-3 font-semibold" style={{ color: primary }}>
                  {a.indicativeValue ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <AgentAvatar initials={a.agent} primaryColor={primary} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="text-sm font-semibold hover:underline"
                    style={{ color: primary }}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
