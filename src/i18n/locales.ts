/** Launch locales. English is intentionally absent. */
export const enabledLocales = ["ar", "fr"] as const;

export const defaultLocale = "ar";

export type EnabledLocale = (typeof enabledLocales)[number];

export function isEnabledLocale(value: string): value is EnabledLocale {
  return enabledLocales.includes(value as EnabledLocale);
}
