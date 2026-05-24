"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { parseMailListPage } from "@/lib/mail/mail-admin-url";

export function useMailAdminUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parseMailListPage(searchParams.get("page"));
  const branchFromUrl =
    searchParams.get("branch") ?? searchParams.get("vertical");

  const setUrl = useCallback(
    (next: { branch?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.branch !== undefined) {
        params.set("branch", next.branch);
        params.delete("vertical");
      }
      if (next.page !== undefined) {
        if (next.page <= 1) params.delete("page");
        else params.set("page", String(next.page));
      }
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [router, pathname, searchParams],
  );

  return { page, branchFromUrl, setUrl };
}
