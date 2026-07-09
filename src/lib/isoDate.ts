const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Strict yyyy-mm-dd validation without JavaScript's rollover behavior. */
export const isValidIsoDate = (
  value: string,
  minYear = 2000,
  maxYear = 2100,
): boolean => {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < minYear || year > maxYear) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};
