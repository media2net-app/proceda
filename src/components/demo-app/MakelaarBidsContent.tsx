"use client";

import { useState } from "react";
import { useMakelaarPortal } from "./MakelaarPortalContext";
import { DemoPageHeader, useDemoAction } from "./demo-ui";

const STATUS_STYLE = {
  actief: "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]",
  vervallen: "bg-[#F2F4F7] text-[#667085] border-[#EAECF0]",
  geaccepteerd: "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]",
};

export default function MakelaarBidsContent() {
  const { brand, data } = useMakelaarPortal();
  const primary = brand.primaryColor;
  const { run, Toast } = useDemoAction();
  const { bidProperty } = data;
  const [bids, setBids] = useState(bidProperty.bids);

  const highest = [...bids].sort((a, b) => b.amountNum - a.amountNum)[0];

  return (
    <>
      {Toast}
      <DemoPageHeader
        brand={brand}
        title="Biedlogboek"
        subtitle="NVM Protocol Transparant Bieden — volledige audittrail"
        action={
          <button
            type="button"
            onClick={() => run("Biedlogboek geëxporteerd (PDF)")}
            className="rounded-lg border border-[#D0D5DD] bg-white px-4 py-2 text-sm font-medium text-[#344054] shadow-xs hover:bg-[#F9FAFB]"
          >
            Export audittrail
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-[#667085]">Object</p>
          <p className="mt-1 font-semibold text-[#101828]">{bidProperty.address}</p>
          <p className="text-sm text-[#667085]">Vraagprijs {bidProperty.askingPrice}</p>
        </div>
        <div className="rounded-xl border border-[#EAECF0] bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-[#667085]">Hoogste bod</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: primary }}>
            {highest?.amount}
          </p>
          <p className="text-xs text-[#667085]">{highest?.bidder}</p>
        </div>
        <div
          className={`rounded-xl border p-4 shadow-xs ${
            bidProperty.protocolCompliant
              ? "border-[#ABEFC6] bg-[#ECFDF3]"
              : "border-[#FECDCA] bg-[#FEF3F2]"
          }`}
        >
          <p className="text-xs font-medium text-[#667085]">Protocol</p>
          <p
            className={`mt-1 text-sm font-semibold ${
              bidProperty.protocolCompliant ? "text-[#027A48]" : "text-[#B42318]"
            }`}
          >
            {bidProperty.protocolCompliant
              ? "✓ Voldoet aan NVM biedlogboek"
              : "Actie vereist"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#EAECF0] bg-white shadow-xs">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[#EAECF0] bg-[#F9FAFB] text-xs text-[#667085]">
            <tr>
              <th className="px-4 py-3 font-medium">Datum</th>
              <th className="px-4 py-3 font-medium">Bieder</th>
              <th className="px-4 py-3 font-medium">Bedrag</th>
              <th className="px-4 py-3 font-medium">Financiering</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Voorwaarden</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid) => (
              <tr
                key={bid.id}
                className="border-b border-[#EAECF0] last:border-b-0 hover:bg-[#F9FAFB]"
              >
                <td className="px-4 py-3 text-[#667085]">{bid.date}</td>
                <td className="px-4 py-3 font-medium text-[#101828]">{bid.bidder}</td>
                <td className="px-4 py-3 font-bold" style={{ color: primary }}>
                  {bid.amount}
                </td>
                <td className="px-4 py-3 text-[#475467]">{bid.financing}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                      STATUS_STYLE[bid.status]
                    }`}
                  >
                    {bid.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#667085]">
                  {bid.conditions ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[#98A2B3]">
        Demo: na afloop verkoop worden biedingen transparant gedeeld met verkoper en bieders
        conform NVM-protocol.
      </p>
    </>
  );
}
