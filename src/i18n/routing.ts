import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["nl", "en", "ro"],
  defaultLocale: "nl",
  localePrefix: "always",
});
