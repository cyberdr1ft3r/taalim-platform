import "server-only";

export interface SecondFactorEvidence {
  /**
   * Verified session claims. Only `fva` is consulted. `amr` is accepted in
   * the type solely so negative tests can prove it is ignored.
   */
  claims?: { fva?: unknown; amr?: unknown } | null;
  /** Clerk auth object `factorVerificationAge` tuple, if available. */
  factorVerificationAge?: [firstFactorAge: number, secondFactorAge: number] | null;
}

/**
 * Canonical server-side check for a completed second factor.
 *
 * The only evidence trusted is Clerk's documented `fva` (factor verification
 * age) claim on v2 session tokens, exposed directly on the auth object as
 * `factorVerificationAge: [firstFactorAge, secondFactorAge]`. A non-negative
 * second-factor age proves a second factor was verified within that session;
 * `-1` proves it was never verified. When neither claim is present the
 * session is treated as single-factor.
 *
 * `amr` (authentication method references) is deliberately not consulted: it
 * is not a documented default v2 claim, and Clerk treats passkeys as a
 * passwordless first-factor authentication method rather than a second-factor
 * strategy. No authentication-method entry is allowed to override an
 * explicit `fva` second-factor absence.
 *
 * This does not configure the Clerk tenant. Multi-factor enrollment for
 * teacher/admin accounts is dashboard configuration that repository code
 * cannot perform; see docs/architecture/authentication.md.
 */
export function sessionHasSecondFactor(evidence: SecondFactorEvidence): boolean {
  const claims = evidence.claims;
  const fva =
    (claims && Array.isArray(claims.fva) ? claims.fva : null) ??
    evidence.factorVerificationAge ??
    null;
  if (Array.isArray(fva) && fva.length >= 2) {
    const secondFactorAge = fva[1];
    return typeof secondFactorAge === "number" && secondFactorAge >= 0;
  }
  return false;
}
