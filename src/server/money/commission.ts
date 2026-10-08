export interface CommissionSplit {
  grossMinor: number;
  platformCommissionMinor: number;
  teacherPayableMinor: number;
}

function assertInteger(name: string, value: number) {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${name} must be a safe integer`);
  }
}

export function splitCommissionHalfUp(grossMinor: number, basisPoints: number): CommissionSplit {
  assertInteger("grossMinor", grossMinor);
  assertInteger("basisPoints", basisPoints);
  if (grossMinor < 0) throw new Error("grossMinor must be non-negative");
  if (basisPoints < 0 || basisPoints > 10_000) {
    throw new Error("basisPoints must be between 0 and 10000");
  }

  const numerator = BigInt(grossMinor) * BigInt(basisPoints);
  const platformCommissionMinor = Number((numerator + BigInt(5_000)) / BigInt(10_000));
  const teacherPayableMinor = grossMinor - platformCommissionMinor;

  return { grossMinor, platformCommissionMinor, teacherPayableMinor };
}
