# Logging

`createLogger` writes Pino JSON to stdout. The level comes from `LOG_LEVEL`.

Redacted paths include authorization headers, cookies, tokens, secrets, passwords, CVV, card numbers, signed URLs, and storage access tokens, including one level of nesting. The censor value is `[redacted]`.

Do not log learner records, teacher verification files, payment payloads, or raw provider errors. The worker logs `error.name` only.

Request logs that include headers must pass those headers through this logger so the redact list applies.
