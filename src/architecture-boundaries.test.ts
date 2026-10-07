import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

async function lint(relativePath: string, code: string) {
  const eslint = new ESLint({ cwd: process.cwd() });
  const results = await eslint.lintText(code, {
    filePath: path.join(process.cwd(), relativePath),
  });
  return results[0]?.messages.filter((message) => message.ruleId === "no-restricted-imports") ?? [];
}

describe("architecture import boundaries", () => {
  it("rejects filesystem and storage SDK imports from feature code", async () => {
    const messages = await lint(
      "src/features/private-file.ts",
      'import fs from "node:fs";\nimport s3 from "@aws-sdk/client-s3";\nexport const marker = [fs, s3];\n',
    );
    expect(messages.length).toBeGreaterThan(0);
  });

  it("rejects a payment SDK import from feature code", async () => {
    const messages = await lint(
      "src/features/checkout.ts",
      'import Stripe from "stripe";\nexport const marker = Stripe;\n',
    );
    expect(messages.length).toBeGreaterThan(0);
  });
});
