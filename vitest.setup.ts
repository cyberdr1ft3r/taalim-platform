import "@testing-library/jest-dom/vitest";
import { assertTestDatabaseAllowed } from "./src/server/config/database-safety";

const taalimEnv = process.env.TAALIM_ENV ?? "test";
const databaseUrl = process.env.DATABASE_URL ?? "postgresql://taalim:taalim@127.0.0.1:5432/taalim_test";

process.env.TAALIM_ENV ??= taalimEnv;
process.env.DATABASE_URL ??= databaseUrl;

assertTestDatabaseAllowed({
  taalimEnv: process.env.TAALIM_ENV,
  databaseUrl: process.env.DATABASE_URL,
});
