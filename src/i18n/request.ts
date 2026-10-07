import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const catalogs = {
  ar: () => import("../../messages/ar.json"),
  fr: () => import("../../messages/fr.json"),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const messages = (await catalogs[locale]()).default;
  return { locale, messages };
});
