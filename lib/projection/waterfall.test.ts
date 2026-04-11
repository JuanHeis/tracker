import { describe, it, expect } from "vitest";
import {
  computeWaterfallData,
  WATERFALL_COLORS,
} from "./waterfall";
import type { WaterfallBar, WaterfallInput, SubcategoryItem } from "./waterfall";
import { CurrencyType } from "@/constants/investments";
import type { Expense, ExtraIncome, Investment } from "@/hooks/useMoneyTracker";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: crypto.randomUUID(),
    date: "2026-03-15",
    name: "Test Expense",
    amount: 10000,
    usdRate: 1,
    category: "Otros",
    currencyType: CurrencyType.ARS,
    ...overrides,
  };
}

function makeExtraIncome(overrides: Partial<ExtraIncome> = {}): ExtraIncome {
  return {
    id: crypto.randomUUID(),
    date: "2026-03-15",
    name: "Freelance",
    amount: 50000,
    usdRate: 1,
    currencyType: CurrencyType.ARS,
    ...overrides,
  };
}

function makeInvestment(overrides: Partial<Investment> = {}): Investment {
  return {
    id: crypto.randomUUID(),
    name: "Test Fund",
    type: "FCI",
    currencyType: CurrencyType.ARS,
    status: "Activa",
    movements: [],
    currentValue: 100000,
    lastUpdated: "2026-03-15",
    createdAt: "2026-01-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<WaterfallInput> = {}): WaterfallInput {
  return {
    expenses: [],
    investments: [],
    salaryAmount: 0,
    extraIncomes: [],
    selectedMonth: "2026-03",
    viewMode: "mes",
    payDay: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("computeWaterfallData", () => {
  // FLOW-01: Returns 5 bars with correct running totals
  describe("FLOW-01: 5-bar structure and running totals", () => {
    it("returns exactly 5 bars with correct names", () => {
      const result = computeWaterfallData(baseInput());
      expect(result).toHaveLength(5);
      expect(result.map((b) => b.name)).toEqual([
        "Ingresos",
        "Gastos Fijos",
        "Gastos Variables",
        "Inversiones",
        "Libre",
      ]);
    });

    it("computes correct running totals with salary and variable expenses", () => {
      const input = baseInput({
        salaryAmount: 500000,
        expenses: [
          makeExpense({ amount: 60000, name: "Compra A" }),
          makeExpense({ amount: 40000, name: "Compra B" }),
        ],
      });
      const result = computeWaterfallData(input);

      // Ingresos: barBottom=0, barTop=500000, amount=500000
      expect(result[0]).toMatchObject({
        name: "Ingresos",
        barBottom: 0,
        barTop: 500000,
        amount: 500000,
      });

      // Gastos Fijos: no recurring -> barBottom=500000, barTop=500000, amount=0
      expect(result[1]).toMatchObject({
        name: "Gastos Fijos",
        barBottom: 500000,
        barTop: 500000,
        amount: 0,
      });

      // Gastos Variables: 100000 total -> barBottom=400000, barTop=500000, amount=100000
      expect(result[2]).toMatchObject({
        name: "Gastos Variables",
        barBottom: 400000,
        barTop: 500000,
        amount: 100000,
      });

      // Inversiones: none -> barBottom=400000, barTop=400000, amount=0
      expect(result[3]).toMatchObject({
        name: "Inversiones",
        barBottom: 400000,
        barTop: 400000,
        amount: 0,
      });

      // Libre: barBottom=0, barTop=400000, amount=400000
      expect(result[4]).toMatchObject({
        name: "Libre",
        barBottom: 0,
        barTop: 400000,
        amount: 400000,
      });
    });

    it("assigns correct colors to each bar", () => {
      const result = computeWaterfallData(baseInput({ salaryAmount: 100000 }));
      expect(result[0].fill).toBe(WATERFALL_COLORS.ingresos);
      expect(result[1].fill).toBe(WATERFALL_COLORS.gastosFijos);
      expect(result[2].fill).toBe(WATERFALL_COLORS.gastosVariables);
      expect(result[3].fill).toBe(WATERFALL_COLORS.inversiones);
      expect(result[4].fill).toBe(WATERFALL_COLORS.libre);
    });
  });

  // FLOW-02: recurringId classification
  describe("FLOW-02: recurringId classification", () => {
    it("classifies expenses with recurringId as fixed, others as variable", () => {
      const input = baseInput({
        salaryAmount: 500000,
        expenses: [
          makeExpense({ name: "Netflix", amount: 5000, recurringId: "rec-1" }),
          makeExpense({ name: "Alquiler", amount: 150000, recurringId: "rec-2" }),
          makeExpense({ name: "Supermercado", amount: 30000 }),
        ],
      });
      const result = computeWaterfallData(input);

      // Gastos Fijos: 5000 + 150000 = 155000
      expect(result[1].amount).toBe(155000);
      // Gastos Variables: 30000
      expect(result[2].amount).toBe(30000);
    });
  });

  // FLOW-03: Subcategory breakdown (top 5 + Otros)
  describe("FLOW-03: subcategory breakdown", () => {
    it("shows top 5 subcategories plus Otros for variable expenses", () => {
      const expenses = [
        makeExpense({ name: "A", amount: 70000 }),
        makeExpense({ name: "B", amount: 60000 }),
        makeExpense({ name: "C", amount: 50000 }),
        makeExpense({ name: "D", amount: 40000 }),
        makeExpense({ name: "E", amount: 30000 }),
        makeExpense({ name: "F", amount: 20000 }),
        makeExpense({ name: "G", amount: 10000 }),
      ];
      const input = baseInput({ salaryAmount: 1000000, expenses });
      const result = computeWaterfallData(input);

      const variableSubs = result[2].subcategories;
      expect(variableSubs).toHaveLength(6); // top 5 + Otros

      // Sorted descending by amount
      expect(variableSubs[0]).toEqual({ name: "A", amount: 70000 });
      expect(variableSubs[1]).toEqual({ name: "B", amount: 60000 });
      expect(variableSubs[2]).toEqual({ name: "C", amount: 50000 });
      expect(variableSubs[3]).toEqual({ name: "D", amount: 40000 });
      expect(variableSubs[4]).toEqual({ name: "E", amount: 30000 });
      // Otros: 20000 + 10000 = 30000
      expect(variableSubs[5]).toEqual({ name: "Otros", amount: 30000 });
    });

    it("shows all items when 5 or fewer (no Otros)", () => {
      const expenses = [
        makeExpense({ name: "A", amount: 50000 }),
        makeExpense({ name: "B", amount: 30000 }),
      ];
      const input = baseInput({ salaryAmount: 500000, expenses });
      const result = computeWaterfallData(input);

      expect(result[2].subcategories).toHaveLength(2);
      expect(result[2].subcategories[0]).toEqual({ name: "A", amount: 50000 });
      expect(result[2].subcategories[1]).toEqual({ name: "B", amount: 30000 });
    });

    it("groups same-name expenses in subcategories", () => {
      const expenses = [
        makeExpense({ name: "Uber", amount: 5000 }),
        makeExpense({ name: "Uber", amount: 3000 }),
        makeExpense({ name: "Rappi", amount: 10000 }),
      ];
      const input = baseInput({ salaryAmount: 500000, expenses });
      const result = computeWaterfallData(input);

      const variableSubs = result[2].subcategories;
      expect(variableSubs).toHaveLength(2);
      expect(variableSubs[0]).toEqual({ name: "Rappi", amount: 10000 });
      expect(variableSubs[1]).toEqual({ name: "Uber", amount: 8000 });
    });
  });

  // FLOW-05: USD conversion per transaction
  describe("FLOW-05: USD conversion per transaction", () => {
    it("converts USD expenses using per-transaction usdRate", () => {
      const input = baseInput({
        salaryAmount: 300000,
        expenses: [
          makeExpense({ amount: 50000, currencyType: CurrencyType.ARS }),
          makeExpense({
            name: "Steam",
            amount: 100,
            currencyType: CurrencyType.USD,
            usdRate: 1200,
          }),
        ],
      });
      const result = computeWaterfallData(input);

      // 50000 + (100 * 1200) = 170000
      expect(result[2].amount).toBe(170000);
    });

    it("converts USD extraIncomes using per-transaction usdRate", () => {
      const input = baseInput({
        salaryAmount: 0,
        extraIncomes: [
          makeExtraIncome({
            amount: 200,
            currencyType: CurrencyType.USD,
            usdRate: 1300,
          }),
          makeExtraIncome({ amount: 100000, currencyType: CurrencyType.ARS }),
        ],
      });
      const result = computeWaterfallData(input);

      // (200 * 1300) + 100000 = 360000
      expect(result[0].amount).toBe(360000);
    });
  });

  // Investment filtering
  describe("investment movement filtering", () => {
    it("excludes isInitial movements and computes net investment", () => {
      const investmentA = makeInvestment({
        movements: [
          { id: "m1", date: "2026-03-05", type: "aporte", amount: 50000, isInitial: false },
          { id: "m2", date: "2026-03-10", type: "aporte", amount: 30000, isInitial: true },
        ],
      });
      const investmentB = makeInvestment({
        movements: [
          { id: "m3", date: "2026-03-15", type: "aporte", amount: 20000 },
          { id: "m4", date: "2026-03-20", type: "retiro", amount: 10000 },
        ],
      });
      const input = baseInput({
        salaryAmount: 500000,
        investments: [investmentA, investmentB],
      });
      const result = computeWaterfallData(input);

      // Net: 50000 + 20000 - 10000 = 60000 (isInitial excluded)
      expect(result[3].amount).toBe(60000);
    });

    it("converts USD investment movements using investment currencyType and a default rate", () => {
      const usdInvestment = makeInvestment({
        currencyType: CurrencyType.USD,
        movements: [
          { id: "m1", date: "2026-03-05", type: "aporte", amount: 100 },
        ],
      });
      const input = baseInput({
        salaryAmount: 500000,
        investments: [usdInvestment],
        // NOTE: For USD investments, we need a conversion mechanism.
        // The function should accept an optional globalUsdRate for investment conversion.
      });
      const result = computeWaterfallData(input);

      // USD investments should still show as a positive investment amount
      // The exact conversion depends on implementation
      expect(result[3].amount).toBeGreaterThan(0);
    });

    it("builds subcategories for investments by investment name", () => {
      const invA = makeInvestment({
        name: "FCI Alpha",
        movements: [
          { id: "m1", date: "2026-03-05", type: "aporte", amount: 50000 },
        ],
      });
      const invB = makeInvestment({
        name: "Crypto BTC",
        movements: [
          { id: "m2", date: "2026-03-10", type: "aporte", amount: 30000 },
        ],
      });
      const input = baseInput({
        salaryAmount: 500000,
        investments: [invA, invB],
      });
      const result = computeWaterfallData(input);

      expect(result[3].subcategories).toHaveLength(2);
      expect(result[3].subcategories[0]).toEqual({ name: "FCI Alpha", amount: 50000 });
      expect(result[3].subcategories[1]).toEqual({ name: "Crypto BTC", amount: 30000 });
    });
  });

  // Edge cases
  describe("edge cases", () => {
    it("returns all zero amounts for empty month", () => {
      const result = computeWaterfallData(baseInput());

      for (const bar of result) {
        expect(bar.amount).toBe(0);
      }
      expect(result[4].barBottom).toBe(0);
      expect(result[4].barTop).toBe(0);
    });

    it("handles negative libre (expenses > income)", () => {
      const input = baseInput({
        salaryAmount: 100000,
        expenses: [makeExpense({ amount: 150000 })],
      });
      const result = computeWaterfallData(input);

      // Libre is negative: -50000
      const libre = result[4];
      expect(libre.amount).toBe(-50000);
      expect(libre.barBottom).toBe(-50000);
      expect(libre.barTop).toBe(0);
    });

    it("includes extra incomes in Ingresos total", () => {
      const input = baseInput({
        salaryAmount: 200000,
        extraIncomes: [
          makeExtraIncome({ amount: 50000, currencyType: CurrencyType.ARS }),
        ],
      });
      const result = computeWaterfallData(input);

      expect(result[0].amount).toBe(250000);
    });

    it("filters expenses by date range respecting viewMode and payDay", () => {
      const input = baseInput({
        salaryAmount: 500000,
        viewMode: "mes",
        payDay: 1,
        selectedMonth: "2026-03",
        expenses: [
          makeExpense({ date: "2026-03-15", amount: 50000, name: "In range" }),
          makeExpense({ date: "2026-04-05", amount: 99999, name: "Out of range" }),
          makeExpense({ date: "2026-02-28", amount: 88888, name: "Before range" }),
        ],
      });
      const result = computeWaterfallData(input);

      // Only the March expense should be counted
      expect(result[2].amount).toBe(50000);
    });

    it("filters investment movements by date range", () => {
      const inv = makeInvestment({
        movements: [
          { id: "m1", date: "2026-03-15", type: "aporte", amount: 50000 },
          { id: "m2", date: "2026-04-05", type: "aporte", amount: 99999 },
        ],
      });
      const input = baseInput({
        salaryAmount: 500000,
        selectedMonth: "2026-03",
        viewMode: "mes",
        investments: [inv],
      });
      const result = computeWaterfallData(input);

      expect(result[3].amount).toBe(50000);
    });

    it("builds subcategories for Ingresos (salary + each extra income)", () => {
      const input = baseInput({
        salaryAmount: 300000,
        extraIncomes: [
          makeExtraIncome({ name: "Freelance", amount: 100000 }),
          makeExtraIncome({ name: "Venta MP", amount: 50000 }),
        ],
      });
      const result = computeWaterfallData(input);

      const ingresosSubs = result[0].subcategories;
      expect(ingresosSubs).toContainEqual({ name: "Sueldo", amount: 300000 });
      expect(ingresosSubs).toContainEqual({ name: "Freelance", amount: 100000 });
      expect(ingresosSubs).toContainEqual({ name: "Venta MP", amount: 50000 });
    });
  });
});
