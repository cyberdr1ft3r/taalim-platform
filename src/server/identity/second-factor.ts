import "server-only";

export const SECOND_FACTOR_METHODS: ReadonlySet<string> = new Set([
  "totp",
  "otp",
  "backup_code",
  "passkey",
]);

export interface SecondFactorEvidence {
  /** Verified session claims. `amr` and `fva` are Clerk session-token claims. */
  claims?: { amr?: unknown; fva?: unknown } | null;
  /** Clerk auth object `factorVerificationAge` tuple, if available. */
  factorVerificationAge?: [firstFactorAge: number, secondFactorAge: number] | null;
}

/**
 * Provider-supported server-side check for a completed second factor.
 *
 * Reads the Clerk session-token `amr` (authentication method references) for a
 * second-factor method, falling back to the `fva` (factor verification age)
 * tuple when `amr` is absent. Fails closed: a session without recognizable
 * second-factor evidence is treated as single-factor.
 *
 * This does not configure the Clerk tenant. Multi-factor enrollment for
 * teacher/admin accounts is dashboard configuration that repository code
 * cannot perform; see docs/architecture/authentication.md.
 */
export function sessionHasSecondFactor(evidence: SecondFactorEvidence): boolean {
  const claims = evidence.claims;
  if (claims && Array.isArray(claims.amr)) {
    for (const entry of claims.amr) {
      if (entry && typeof entry === "object" && "method" in entry) {
        const method = (entry as { method?: unknown }).method;
        if (typeof method === "string" && SECOND_FACTOR_METHODS.has(method)) return true;
      }
    }
  }
  const fva =
    (claims && Array.isArray(claims.fva) ? claims.fva : null) ??
    evidence.factorVerificationAge ??
    null;
  if (Array.isArray(fva) && fva.length >= 2 && typeof fva[1] === "number" && fva[1] >= 0) {
    return true;
  }
  return false;
}
