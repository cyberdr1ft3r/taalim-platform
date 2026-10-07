import { expect, test } from "@playwright/test";

test("arabic home renders right to left", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "أساس تطبيق تعليم" })).toBeVisible();
});

test("french home renders left to right", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Socle applicatif Taalim" })).toBeVisible();
});

test("english is not an enabled launch locale", async ({ page }) => {
  const response = await page.goto("/en");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Taalim application foundation" })).toHaveCount(0);
});

test("health reports the web process without secrets", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toEqual({ status: "ok", service: "taalim-web" });
});

test("the foundation form validates a synthetic note", async ({ page }) => {
  await page.goto("/fr");
  await page.getByRole("button", { name: "Vérifier le formulaire" }).click();
  await expect(page.getByText("Saisissez une note d'essai")).toBeVisible();
  await page.getByLabel("Note d'essai").fill("note");
  await page.getByRole("button", { name: "Vérifier le formulaire" }).click();
  await expect(page.getByText("La note d'essai est acceptée")).toBeVisible();
});
