import { z } from "zod";
import { assertTestDatabaseAllowed } from "./database-safety";

export const envSchema = z.object({
  TAALIM_ENV: z.enum(["development", "test", "staging", "production"]),
  DATABASE_URL: z.string().min(1),
  STORAGE_PROVIDER: z.literal("local"),
  STORAGE_LOCAL_ROOT: z.string().min(1),
  STORAGE_ACCESS_SECRET: z.string().min(32),
  PAYMENT_PROVIDER: z.literal("fake"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  APP_BASE_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().regex(/^pk_(test|live)_/),
  CLERK_SECRET_KEY: z.string().regex(/^sk_(test|live)_/),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const fields = [
      ...new Set(parsed.error.issues.map((issue) => issue.path.join(".") || issue.code)),
    ];
    throw new Error(`Invalid environment configuration: ${fields.join(", ")}`);
  }
  if (parsed.data.TAALIM_ENV === "test") {
    assertTestDatabaseAllowed({
      taalimEnv: parsed.data.TAALIM_ENV,
      databaseUrl: parsed.data.DATABASE_URL,
    });
  }
  return parsed.data;
}
