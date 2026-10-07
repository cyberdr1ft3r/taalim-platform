const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function databaseHost(databaseUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("Refusing an unparseable database URL");
  }
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error("Refusing a non-PostgreSQL database URL");
  }
  if (!parsed.hostname) {
    throw new Error("Refusing a database URL without a host");
  }
  return parsed.hostname;
}

export function assertTestDatabaseAllowed(input: { taalimEnv: string; databaseUrl: string }): void {
  if (input.taalimEnv === "production" || input.taalimEnv === "staging") {
    throw new Error(`Refusing tests while TAALIM_ENV=${input.taalimEnv}`);
  }
  const host = databaseHost(input.databaseUrl);
  if (!LOCAL_DATABASE_HOSTS.has(host)) {
    throw new Error(`Refusing tests against non-local database host "${host}"`);
  }
}
