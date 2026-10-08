/** Thrown when there is no authenticated Clerk session. */
export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthenticationRequiredError";
  }
}

/** Thrown when the Clerk session is valid but no Taalim UserAccount exists for the subject. */
export class AccountNotProvisionedError extends Error {
  constructor() {
    super("No Taalim account is provisioned for this session");
    this.name = "AccountNotProvisionedError";
  }
}

/** Thrown when the business authorization policy denies the action. */
export class AuthorizationDeniedError extends Error {
  constructor(message = "Authorization denied") {
    super(message);
    this.name = "AuthorizationDeniedError";
  }
}

/** Thrown when a privileged operation requires a verified second factor. */
export class SecondFactorRequiredError extends Error {
  constructor() {
    super("Second-factor verification is required for this operation");
    this.name = "SecondFactorRequiredError";
  }
}

/** Thrown when a rate limit for a sensitive action is exceeded. */
export class RateLimitExceededError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Too many attempts. Try again later.");
    this.name = "RateLimitExceededError";
    this.retryAfterSeconds = Math.max(1, Math.ceil(retryAfterSeconds));
  }
}

/** Maps authorization-layer errors to HTTP responses. Returns undefined for unknown errors. */
export function authorizationErrorResponse(error: unknown): Response | undefined {
  if (error instanceof AuthenticationRequiredError) {
    return Response.json({ error: "authentication_required" }, { status: 401 });
  }
  if (error instanceof AccountNotProvisionedError) {
    return Response.json({ error: "account_not_provisioned" }, { status: 403 });
  }
  if (error instanceof SecondFactorRequiredError) {
    return Response.json({ error: "second_factor_required" }, { status: 403 });
  }
  if (error instanceof AuthorizationDeniedError) {
    return Response.json({ error: "authorization_denied" }, { status: 403 });
  }
  if (error instanceof RateLimitExceededError) {
    return Response.json(
      { error: "rate_limited", retryAfterSeconds: error.retryAfterSeconds },
      { status: 429, headers: { "retry-after": String(error.retryAfterSeconds) } },
    );
  }
  return undefined;
}
