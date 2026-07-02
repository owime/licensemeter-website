/** German-style euro formatting to match the product UI: 6.979,90 */
export const euros = (cents: number): string => {
  const whole = Math.floor(cents / 100);
  const frac = Math.abs(cents % 100);
  const grouped = whole
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${grouped},${frac.toString().padStart(2, "0")}`;
};
