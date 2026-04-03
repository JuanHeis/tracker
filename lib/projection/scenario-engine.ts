import { SCENARIOS } from "./types";

/**
 * Project patrimony forward under three scenarios (optimista, base, pesimista).
 *
 * Each scenario applies its savingsMultiplier to monthly net savings.
 * Investment growth is layered on top by the hook (which computes
 * per-scenario investment projections separately using rateMultiplier).
 *
 * Month 0 = currentPatrimony for all scenarios.
 * Month m = currentPatrimony + (monthlyNetSavings * savingsMultiplier * m)
 */
export function projectPatrimonyScenarios(
  currentPatrimony: number,
  monthlyNetSavings: number,
  horizonMonths: number
): { optimista: number[]; base: number[]; pesimista: number[] } {
  const result: { optimista: number[]; base: number[]; pesimista: number[] } = {
    optimista: [],
    base: [],
    pesimista: [],
  };

  for (const scenario of SCENARIOS) {
    const values: number[] = [];
    for (let m = 0; m <= horizonMonths; m++) {
      values.push(
        Math.round(
          currentPatrimony + monthlyNetSavings * scenario.savingsMultiplier * m
        )
      );
    }
    result[scenario.name] = values;
  }

  return result;
}
