"use client";

import { useTranslations } from "next-intl";
import { MAIL_LIST_PAGE_SIZE } from "@/lib/mail/mail-admin-url";

export function MailListPagination({
  page,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const t = useTranslations("adminMail");
  const totalPages = Math.max(1, Math.ceil(totalItems / MAIL_LIST_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = totalItems === 0 ? 0 : (safePage - 1) * MAIL_LIST_PAGE_SIZE + 1;
  const to = Math.min(safePage * MAIL_LIST_PAGE_SIZE, totalItems);

  if (totalItems <= MAIL_LIST_PAGE_SIZE) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EAECF0] px-2 py-2">
      <p className="text-xs text-[#667085]">
        {t("paginationShowing", { from, to, total: totalItems })}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="rounded-md border border-[#D0D5DD] bg-white px-2.5 py-1 text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] disabled:opacity-50"
        >
          {t("paginationPrev")}
        </button>
        <span className="px-1 text-xs tabular-nums text-[#667085]">
          {t("paginationPage", { page: safePage, totalPages })}
        </span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="rounded-md border border-[#D0D5DD] bg-white px-2.5 py-1 text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] disabled:opacity-50"
        >
          {t("paginationNext")}
        </button>
      </div>
    </div>
  );
}
