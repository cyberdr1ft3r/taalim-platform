import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const vendorAndFilesystem = {
  patterns: [
    {
      group: ["node:fs", "node:fs/*", "fs", "fs/*"],
      message:
        "Use the storage service. Direct filesystem access belongs only in storage provider implementations.",
    },
    {
      group: ["@aws-sdk/*", "@supabase/*"],
      message:
        "Object-storage SDKs belong only in a storage provider implementation. Production storage is undecided.",
    },
    {
      group: ["stripe", "stripe/*", "@stripe/*"],
      message: "Payment provider SDKs belong only in a payment provider implementation.",
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "src/generated/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/server/storage/providers/**",
      "src/server/storage/index.ts",
      "src/server/payments/providers/**",
      "src/server/payments/index.ts",
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...vendorAndFilesystem.patterns,
            {
              group: [
                "@/server/storage/providers",
                "@/server/storage/providers/*",
                "@/server/payments/providers",
                "@/server/payments/providers/*",
              ],
              message: "Feature code must use the storage and payment services.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/storage/providers/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@aws-sdk/*", "@supabase/*", "stripe", "@stripe/*"],
              message: "The local filesystem provider must stay free of production vendor SDKs.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/payments/providers/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["node:fs", "node:fs/*", "fs", "fs/*", "@aws-sdk/*", "@supabase/*"],
              message: "Payment providers must not use the filesystem or object-storage SDKs.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/storage/index.ts", "src/server/payments/index.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: vendorAndFilesystem.patterns,
        },
      ],
    },
  },
]);

export default eslintConfig;
