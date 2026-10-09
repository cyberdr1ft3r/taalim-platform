import { describe, expect, it } from "vitest";
import { accountPortalLinks, clerkFrontendApiHost } from "./account-portal";

const PLACEHOLDER_KEY = "pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk";

describe("Clerk Account Portal links", () => {
  it("decodes the placeholder publishable key to the documented frontend API host", () => {
    expect(clerkFrontendApiHost(PLACEHOLDER_KEY)).toBe("example.clerk.accounts.dev");
  });

  it("points sign-in, sign-up, and the user page at that host with an application redirect", () => {
    const links = accountPortalLinks({
      publishableKey: PLACEHOLDER_KEY,
      appBaseUrl: "http://127.0.0.1:3000/",
    });
    const redirect = encodeURIComponent("http://127.0.0.1:3000/");
    expect(links.signInUrl).toBe(`https://example.clerk.accounts.dev/sign-in?redirect_url=${redirect}`);
    expect(links.signUpUrl).toBe(`https://example.clerk.accounts.dev/sign-up?redirect_url=${redirect}`);
    expect(links.userUrl).toBe(`https://example.clerk.accounts.dev/user?redirect_url=${redirect}`);
  });

  it("rejects a key that is not a Clerk publishable key", () => {
    expect(() => clerkFrontendApiHost("sk_test_not_a_publishable_key")).toThrow(/frontend API host/);
  });
});
