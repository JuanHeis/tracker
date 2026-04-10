/**
 * Flat-line income projection: repeats current salary for N months.
 * Returns array of length horizonMonths + 1 (index 0 = current month).
 */
export function projectIncome(
  currentSalary: number,
  horizonMonths: number
): number[] {
  return Array.from({ length: horizonMonths + 1 }, () => currentSalary);
}
