import { describe, expect, it } from "vitest";
import { createLogger } from "./logger";

describe("createLogger", () => {
  it("redacts tokens, payment data, and signed urls", () => {
    const lines: string[] = [];
    const logger = createLogger({
      level: "info",
      stream: {
        write(message: string) {
          lines.push(message);
        },
      },
    });
    logger.info(
      {
        token: "session-token",
        password: "hunter2",
        cvv: "123",
        cardNumber: "4242424242424242",
        signedUrl: "https://example.invalid/signed",
        storageAccessToken: "taalim-local.payload.sig",
        nested: { secret: "top-secret", authorization: "Bearer abc" },
      },
      "synthetic",
    );
    const text = lines.join("");
    expect(text).toContain("[redacted]");
    expect(text).not.toContain("session-token");
    expect(text).not.toContain("hunter2");
    expect(text).not.toContain("4242424242424242");
    expect(text).not.toContain("https://example.invalid/signed");
    expect(text).not.toContain("top-secret");
    expect(text).not.toContain("Bearer abc");
  });
});
