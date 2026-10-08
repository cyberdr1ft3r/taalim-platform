import { expect, test } from "@playwright/test";

test("api rejects unauthenticated identity reads with json 401", async ({ request }) => {
  const response = await request.get("/api/auth/me");
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: "authentication_required" });
});

test("api rejects unauthenticated account bootstrap", async ({ request }) => {
  const response = await request.post("/api/auth/bootstrap", { data: {} });
  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: "authentication_required" });
});

test("api rejects unauthenticated relationship reads and writes", async ({ request }) => {
  const list = await request.get("/api/relationships");
  expect(list.status()).toBe(401);

  const invite = await request.post("/api/relationships", {
    data: { learnerAccountId: "acct_synthetic", relationshipType: "PAYER" },
  });
  expect(invite.status()).toBe(401);
});

test("api rejects unauthenticated session reads and revocations", async ({ request }) => {
  const list = await request.get("/api/auth/sessions");
  expect(list.status()).toBe(401);

  const revoke = await request.delete("/api/auth/sessions/sess_synthetic");
  expect(revoke.status()).toBe(401);
});

test("private object routes answer before any object handling", async ({ request }) => {
  const content = await request.get("/api/objects/obj_synthetic/content");
  expect(content.status()).toBe(401);
  expect(await content.json()).toEqual({ error: "authentication_required" });

  const temporary = await request.post("/api/objects/obj_synthetic/temporary-access", {
    data: { expiresInSeconds: 300 },
  });
  expect(temporary.status()).toBe(401);
});

test("health and public routes remain reachable without a session", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();

  const home = await request.get("/fr");
  expect(home.ok()).toBeTruthy();
});
