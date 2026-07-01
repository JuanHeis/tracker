import { describe, it, expect } from "vitest";
import { CurrencyType } from "@/constants/investments";
import type { Investment, InvestmentMovement, Transfer } from "@/hooks/useMoneyTracker";
import { computeMonthMetrics, sumAportes, type MonthMetricsInput } from "./month-metrics";

let movCounter = 0;

function makeMovement(overrides: Partial<InvestmentMovement> = {}): InvestmentMovement {
  return {
    id: `mov-${movCounter++}`,
    date: "2026-06-10",
    type: "aporte",
    amount: 100,
    ...overrides,
  };
}

function makeInvestment(overrides: Partial<Investment> = {}): Investment {
  return {
    id: `inv-${movCounter++}`,
    name: "Test",
    type: "Otra" as Investment["type"],
    currencyType: CurrencyType.ARS,
    status: "Activa",
    movements: [],
    currentValue: 0,
    lastUpdated: "2026-06-10",
    createdAt: "2026-06-01",
    purpose: "ahorro",
    ...overrides,
  };
}

// Always-in-range predicate (single calendar month) for these tests
const alwaysInRange = () => true;

function baseInput(overrides: Partial<MonthMetricsInput> = {}): MonthMetricsInput {
  return {
    monthKey: "2026-06",
    currency: CurrencyType.ARS,
    investments: [],
    expenses: [],
    extraIncomes: [],
    salaryAmount: 0,
    aguinaldoAmount: 0,
    sobranteAnteriorRaw: 0,
    isInRange: alwaysInRange,
    ...overrides,
  };
}

describe("month-metrics per-movement purpose", () => {
  it("SBS validation case: only the expense reduces Resultado, no double deduction", () => {
    const sbs = makeInvestment({
      purpose: "ahorro",
      movements: [
        makeMovement({ type: "aporte", amount: 200977, isInitial: true, purpose: "ahorro" }),
        makeMovement({ type: "aporte", amount: 344723, purpose: "tarjeta" }),
        makeMovement({ type: "retiro", amount: 314093, purpose: "tarjeta" }),
      ],
    });
    const metrics = computeMonthMetrics(
      baseInput({
        investments: [sbs],
        expenses: [{ amount: 314093, currencyType: CurrencyType.ARS, date: "2026-06-10" }],
      })
    );
    expect(metrics.aportesNoNeutros).toBe(0);
    expect(metrics.resultadoDelMes).toBe(-314093);
  });

  it("D15: isInitial aporte with purpose=ahorro contributes 0 to aportesNoNeutros", () => {
    const inv = makeInvestment({
      purpose: "ahorro",
      movements: [makeMovement({ type: "aporte", amount: 5000, isInitial: true, purpose: "ahorro" })],
    });
    const metrics = computeMonthMetrics(baseInput({ investments: [inv] }));
    expect(metrics.aportesNoNeutros).toBe(0);
  });

  it("D16: retiro with purpose=ahorro contributes 0 (retiros never counted)", () => {
    const inv = makeInvestment({
      purpose: "ahorro",
      movements: [makeMovement({ type: "retiro", amount: 5000, purpose: "ahorro" })],
    });
    const metrics = computeMonthMetrics(baseInput({ investments: [inv] }));
    expect(metrics.aportesNoNeutros).toBe(0);
  });

  it("D14 override: movement purpose tarjeta is neutral; missing purpose inherits ahorro and counts", () => {
    const inv = makeInvestment({
      purpose: "ahorro",
      movements: [
        makeMovement({ type: "aporte", amount: 1000, purpose: "tarjeta" }),
        makeMovement({ type: "aporte", amount: 2000 }), // no purpose -> inherits ahorro
      ],
    });
    const metrics = computeMonthMetrics(baseInput({ investments: [inv] }));
    expect(metrics.aportesNoNeutros).toBe(2000);
  });

  it("especulacion: non-initial aporte purpose=especulacion is counted", () => {
    const inv = makeInvestment({
      purpose: "tarjeta",
      movements: [makeMovement({ type: "aporte", amount: 1500, purpose: "especulacion" })],
    });
    const metrics = computeMonthMetrics(baseInput({ investments: [inv] }));
    expect(metrics.aportesNoNeutros).toBe(1500);
  });

  it("regression: aportesAll sums all non-initial, non-pending aportes regardless of purpose", () => {
    const inv = makeInvestment({
      purpose: "ahorro",
      movements: [
        makeMovement({ type: "aporte", amount: 1000, purpose: "tarjeta" }),
        makeMovement({ type: "aporte", amount: 2000, purpose: "ahorro" }),
        makeMovement({ type: "aporte", amount: 500, isInitial: true, purpose: "ahorro" }), // excluded
        makeMovement({ type: "aporte", amount: 700, pendingIngreso: true, purpose: "ahorro" }), // excluded
        makeMovement({ type: "retiro", amount: 300, purpose: "ahorro" }), // excluded
      ],
    });
    expect(sumAportes([inv], CurrencyType.ARS, alwaysInRange, false)).toBe(3000);
  });
});

// Phase 23-02: Disponible absorbs the FULL cash effect via computeCashEffect.
// Resultado del mes keeps D2 semantics (retiros excluded, tarjeta/objetivo neutral).
describe("month-metrics cash effect folded into Disponible (Phase 23-02)", () => {
  it("a currency_ars_to_usd conversion in range drops Disponible by arsAmount but NOT Resultado", () => {
    const transfer: Transfer = {
      id: "t-1",
      date: "2026-06-04",
      type: "currency_ars_to_usd",
      arsAmount: 362500,
      usdAmount: 250,
      createdAt: "2026-06-04",
    } as Transfer;
    const metrics = computeMonthMetrics(
      baseInput({
        salaryAmount: 390668.76,
        transfers: [transfer],
      })
    );
    // cashEffect (ARS) = -362500 → Disponible = 390668.76 - 362500 = 28168.76 (June anchor).
    expect(metrics.cashEffect).toBeCloseTo(-362500, 2);
    expect(metrics.disponible).toBeCloseTo(28168.76, 2);
    // Resultado del mes is unchanged by cash movements (only salary here, no gastos/aportesNoNeutros).
    expect(metrics.resultadoDelMes).toBeCloseTo(390668.76, 2);
  });

  it("USD side of the same conversion adds cash to Disponible", () => {
    const transfer: Transfer = {
      id: "t-1",
      date: "2026-06-04",
      type: "currency_ars_to_usd",
      arsAmount: 362500,
      usdAmount: 250,
      createdAt: "2026-06-04",
    } as Transfer;
    const metrics = computeMonthMetrics(
      baseInput({
        currency: CurrencyType.USD,
        transfers: [transfer],
      })
    );
    expect(metrics.cashEffect).toBeCloseTo(250, 2);
    expect(metrics.disponible).toBeCloseTo(250, 2);
    expect(metrics.resultadoDelMes).toBeCloseTo(0, 2);
  });

  it("omitting cash arrays defaults to [] → cashEffect 0 (history-loop compat)", () => {
    const metrics = computeMonthMetrics(baseInput({ salaryAmount: 1000 }));
    expect(metrics.cashEffect).toBe(0);
    expect(metrics.disponible).toBe(1000);
  });

  it("Opción B: investment aporte reduces Disponible via aportesNoNeutros, NOT via cashEffect", () => {
    const inv = makeInvestment({
      purpose: "ahorro",
      movements: [makeMovement({ type: "aporte", amount: 2000, purpose: "ahorro" })],
    });
    const metrics = computeMonthMetrics(baseInput({ investments: [inv], salaryAmount: 5000 }));
    // Opción B: cashEffect EXCLUDES investments (they are savings, not raw cash).
    expect(metrics.cashEffect).toBe(0);
    // Disponible = sobrante(0) + ingresos(5000) - gastos(0) - aportesNoNeutros(2000) + cashEffect(0) = 3000.
    expect(metrics.disponible).toBeCloseTo(3000, 2);
    // Resultado subtracts the non-neutro aporte once (D2 unchanged).
    expect(metrics.resultadoDelMes).toBeCloseTo(3000, 2);
  });
});
