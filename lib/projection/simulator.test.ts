import { describe, it, expect } from "vitest";
import {
  SimulatedExpense,
  applySimulatedExpenses,
  computeSimulatorSummary,
  buildSimulatorData,
} from "./simulator";
import { CurrencyType } from "@/constants/investments";

// Base projection: 5 months, month 0 = 1_000_000, growing 100k/month
const baseProjection = [1_000_000, 1_100_000, 1_200_000, 1_300_000, 1_400_000];

describe("applySimulatedExpenses", () => {
  it("returns identical copy when expenses array is empty", () => {
    const result = applySimulatedExpenses(baseProjection, [], 1200);
    expect(result).toEqual(baseProjection);
    expect(result).not.toBe(baseProjection); // must be a copy
  });

  it("subtracts one-time ARS expense cumulatively from month 1 onward", () => {
    const expense: SimulatedExpense = {
      id: "1",
      name: "Notebook",
      totalAmount: 10000,
      installments: 1,
      currencyType: CurrencyType.ARS,
    };
    const result = applySimulatedExpenses(baseProjection, [expense], 1200);
    expect(result[0]).toBe(1_000_000); // month 0 unchanged
    expect(result[1]).toBe(1_100_000 - 10000);
    expect(result[2]).toBe(1_200_000 - 10000);
    expect(result[3]).toBe(1_300_000 - 10000);
    expect(result[4]).toBe(1_400_000 - 10000);
  });

  it("spreads installment ARS expense across N months cumulatively", () => {
    const expense: SimulatedExpense = {
      id: "2",
      name: "Heladera",
      totalAmount: 30000,
      installments: 3,
      currencyType: CurrencyType.ARS,
    };
    // perMonth = 30000 / 3 = 10000
    // month 1: -10000 (1st installment hits months 1..end)
    // month 2: -10000 more (2nd installment hits months 2..end) => -20000 total
    // month 3: -10000 more (3rd installment hits months 3..end) => -30000 total
    // month 4: no new installment => still -30000 total
    const result = applySimulatedExpenses(baseProjection, [expense], 1200);
    expect(result[0]).toBe(1_000_000);
    expect(result[1]).toBe(1_100_000 - 10000);
    expect(result[2]).toBe(1_200_000 - 20000);
    expect(result[3]).toBe(1_300_000 - 30000);
    expect(result[4]).toBe(1_400_000 - 30000);
  });

  it("converts USD expense using globalUsdRate before subtraction", () => {
    const expense: SimulatedExpense = {
      id: "3",
      name: "iPhone",
      totalAmount: 100,
      installments: 1,
      currencyType: CurrencyType.USD,
    };
    // 100 USD * 1200 = 120_000 ARS
    const result = applySimulatedExpenses(baseProjection, [expense], 1200);
    expect(result[0]).toBe(1_000_000);
    expect(result[1]).toBe(1_100_000 - 120_000);
    expect(result[2]).toBe(1_200_000 - 120_000);
  });

  it("never modifies month 0 (current patrimony)", () => {
    const expense: SimulatedExpense = {
      id: "4",
      name: "Big expense",
      totalAmount: 5_000_000,
      installments: 1,
      currencyType: CurrencyType.ARS,
    };
    const result = applySimulatedExpenses(baseProjection, [expense], 1200);
    expect(result[0]).toBe(1_000_000);
  });

  it("only applies installments within array bounds", () => {
    // 10 installments but only 4 future months (indices 1-4)
    const expense: SimulatedExpense = {
      id: "5",
      name: "Long plan",
      totalAmount: 100_000,
      installments: 10,
      currencyType: CurrencyType.ARS,
    };
    // perMonth = 10_000
    // installment 0 -> month 1..4: -10_000
    // installment 1 -> month 2..4: -10_000 more
    // installment 2 -> month 3..4: -10_000 more
    // installment 3 -> month 4: -10_000 more
    // installments 4-9 -> month 5+ out of bounds
    const result = applySimulatedExpenses(baseProjection, [expense], 1200);
    expect(result[0]).toBe(1_000_000);
    expect(result[1]).toBe(1_100_000 - 10_000);
    expect(result[2]).toBe(1_200_000 - 20_000);
    expect(result[3]).toBe(1_300_000 - 30_000);
    expect(result[4]).toBe(1_400_000 - 40_000);
  });
});

describe("computeSimulatorSummary", () => {
  it("returns totalCost as sum of all expenses in ARS", () => {
    const expenses: SimulatedExpense[] = [
      { id: "1", name: "A", totalAmount: 50_000, installments: 1, currencyType: CurrencyType.ARS },
      { id: "2", name: "B", totalAmount: 100, installments: 3, currencyType: CurrencyType.USD },
    ];
    // 50_000 + (100 * 1200) = 50_000 + 120_000 = 170_000
    const simProjection = applySimulatedExpenses(baseProjection, expenses, 1200);
    const summary = computeSimulatorSummary(expenses, simProjection, 1200);
    expect(summary.totalCost).toBe(170_000);
  });

  it("returns maxMonthlyImpact as largest single-month deduction", () => {
    const expenses: SimulatedExpense[] = [
      { id: "1", name: "A", totalAmount: 30_000, installments: 3, currencyType: CurrencyType.ARS },
      { id: "2", name: "B", totalAmount: 50_000, installments: 1, currencyType: CurrencyType.ARS },
    ];
    // Month 1: A pays 10_000 + B pays 50_000 = 60_000
    // Month 2: A pays 10_000 = 10_000
    // Month 3: A pays 10_000 = 10_000
    // maxMonthlyImpact = 60_000
    const simProjection = applySimulatedExpenses(baseProjection, expenses, 1200);
    const summary = computeSimulatorSummary(expenses, simProjection, 1200);
    expect(summary.maxMonthlyImpact).toBe(60_000);
  });

  it("returns worstBalance as minimum value in simulated projection excluding month 0", () => {
    const expenses: SimulatedExpense[] = [
      { id: "1", name: "Huge", totalAmount: 2_000_000, installments: 1, currencyType: CurrencyType.ARS },
    ];
    const simProjection = applySimulatedExpenses(baseProjection, expenses, 1200);
    // simProjection[1] = 1_100_000 - 2_000_000 = -900_000 (the worst)
    const summary = computeSimulatorSummary(expenses, simProjection, 1200);
    expect(summary.worstBalance).toBe(-900_000);
  });
});

describe("buildSimulatorData", () => {
  it("creates array of SimulatorDataPoint with correct length and values", () => {
    const simProjection = [...baseProjection];
    simProjection[1] -= 10_000;
    simProjection[2] -= 10_000;

    const data = buildSimulatorData(baseProjection, simProjection, 4);
    expect(data).toHaveLength(5); // 0..4
    expect(data[0].sinSimulacion).toBe(1_000_000);
    expect(data[0].conSimulacion).toBe(1_000_000);
    expect(data[1].sinSimulacion).toBe(1_100_000);
    expect(data[1].conSimulacion).toBe(1_090_000);
    // Each item should have month and monthKey strings
    expect(typeof data[0].month).toBe("string");
    expect(data[0].monthKey).toMatch(/^\d{4}-\d{2}$/);
  });
});
