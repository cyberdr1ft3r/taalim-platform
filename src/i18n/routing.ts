import { defineRouting } from "next-intl/routing";
import { defaultLocale, enabledLocales } from "./locales";

export const routing = defineRouting({
  locales: [...enabledLocales],
  defaultLocale,
  localePrefix: "always",
});
