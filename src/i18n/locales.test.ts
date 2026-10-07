import { describe, expect, it } from "vitest";
import ar from "../../messages/ar.json";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import { enabledLocales } from "./locales";
import { routing } from "./routing";

describe("launch locales", () => {
  it("enables Arabic and French and leaves English unrouted", () => {
    expect(routing.locales).toEqual(["ar", "fr"]);
    expect(enabledLocales).toEqual(["ar", "fr"]);
    expect(routing.defaultLocale).toBe("ar");
    expect(Object.keys(en.home).sort()).toEqual(Object.keys(ar.home).sort());
    expect(Object.keys(fr.home).sort()).toEqual(Object.keys(ar.home).sort());
  });
});
