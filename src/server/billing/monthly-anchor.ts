export interface LocalCalendarDate {
  year: number;
  month: number;
  day: number;
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function billingDateForMonth(year: number, month: number, originalBillingDay: number): LocalCalendarDate {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(originalBillingDay)) {
    throw new Error("billing calendar values must be integers");
  }
  if (month < 1 || month > 12) throw new Error("month must be between 1 and 12");
  if (originalBillingDay < 1 || originalBillingDay > 31) {
    throw new Error("originalBillingDay must be between 1 and 31");
  }

  return {
    year,
    month,
    day: Math.min(originalBillingDay, daysInMonth(year, month)),
  };
}

export function nextBillingLocalDate(current: LocalCalendarDate, originalBillingDay: number): LocalCalendarDate {
  const nextMonth = current.month === 12 ? 1 : current.month + 1;
  const nextYear = current.month === 12 ? current.year + 1 : current.year;
  return billingDateForMonth(nextYear, nextMonth, originalBillingDay);
}
