/** FD-01 launch locales. English is not included. */
export const enabledLocales = ["ar", "fr"] as const;

/** Technical route when the URL has no locale. FD-01 does not choose a landing locale. */
export const defaultLocale = "ar";

export type EnabledLocale = (typeof enabledLocales)[number];

export function isEnabledLocale(value: string): value is EnabledLocale {
  return enabledLocales.includes(value as EnabledLocale);
}
