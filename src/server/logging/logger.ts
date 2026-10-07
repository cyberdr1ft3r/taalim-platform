import pino, { type DestinationStream, type Logger } from "pino";

export const REDACT_PATHS = [
  "authorization",
  "cookie",
  "cookies",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "password",
  "cvv",
  "cardNumber",
  "signedUrl",
  "storageAccessToken",
  "req.headers.authorization",
  "req.headers.cookie",
  "*.authorization",
  "*.cookie",
  "*.cookies",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.secret",
  "*.password",
  "*.cvv",
  "*.cardNumber",
  "*.signedUrl",
  "*.storageAccessToken",
];

export function createLogger(options?: { stream?: DestinationStream; level?: string }): Logger {
  return pino(
    {
      level: options?.level ?? process.env.LOG_LEVEL ?? "info",
      redact: {
        paths: REDACT_PATHS,
        censor: "[redacted]",
      },
      base: { service: "taalim" },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    options?.stream,
  );
}
