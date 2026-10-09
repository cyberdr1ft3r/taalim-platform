import { describe, expect, it } from "vitest";
import {
  AccountNotProvisionedError,
  AuthenticationRequiredError,
  AuthorizationDeniedError,
  authorizationErrorResponse,
  RateLimitExceededError,
  SecondFactorRequiredError,
} from "./errors";

describe("authorizationErrorResponse", () => {
  it("maps authentication-required to 401", () => {
    const response = authorizationErrorResponse(new AuthenticationRequiredError());
    expect(response?.status).toBe(401);
  });

  it("maps missing Taalim account to 403", () => {
    const response = authorizationErrorResponse(new AccountNotProvisionedError());
    expect(response?.status).toBe(403);
  });

  it("maps second-factor requirement to 403", () => {
    const response = authorizationErrorResponse(new SecondFactorRequiredError());
    expect(response?.status).toBe(403);
  });

  it("maps policy denial to 403", () => {
    const response = authorizationErrorResponse(new AuthorizationDeniedError());
    expect(response?.status).toBe(403);
  });

  it("maps rate limiting to 429 with retry-after", () => {
    const response = authorizationErrorResponse(new RateLimitExceededError(12.2));
    expect(response?.status).toBe(429);
    expect(response?.headers.get("retry-after")).toBe("13");
  });

  it("leaves unknown errors unmapped", () => {
    expect(authorizationErrorResponse(new Error("boom"))).toBeUndefined();
    expect(authorizationErrorResponse(undefined)).toBeUndefined();
  });

  it("does not leak error messages into response bodies", async () => {
    const response = authorizationErrorResponse(
      new AuthorizationDeniedError("learner 42 is not yours"),
    );
    const body = await response!.json();
    expect(body).toEqual({ error: "authorization_denied" });
  });
});
