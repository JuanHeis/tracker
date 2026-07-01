import { describe, it, expect } from "vitest";
import { CurrencyType } from "@/constants/investments";
import type { Transfer, Loan, UsdPurchase, Investment } from "@/hooks/useMoneyTracker";
// Module does not exist yet — this import is the expected RED failure (Task 2 implements it).
import { computeCashEffect, type CashEffectInput } from "@/lib/resumen/cash-effects";

// Always-in-range predicate for in-range cases.
const inRange = () => true;
// Fixed out-of-range predicate for out-of-range cases.
const outOfRange = () => false;

function makeInput(overrides: Partial<CashEffectInput> = {}): CashEffectInput {
  return {
    currency: CurrencyType.ARS,
    isInRange: inRange,
    transfers: [],
    loans: [],
    usdPurchases: [],
    investments: [],
    ...overrides,
  };
}

function makeTransfer(overrides: Partial<Transfer> = {}): Transfer {
  return {
    id: `t-${Math.random()}`,
    date: "2026-06-10",
    type: "cash_in",
    createdAt: "2026-06-10",
    ...overrides,
  } as Transfer;
}

function makeUsdPurchase(overrides: Partial<UsdPurchase> = {}): UsdPurchase {
  return {
    id: `p-${Math.random()}`,
    date: "2026-06-10",
    arsAmount: 0,
    usdAmount: 0,
    purchaseRate: 1450,
    origin: "tracked",
    ...overrides,
  };
}

function makeLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: `l-${Math.random()}`,
    type: "preste",
    persona: "Juan",
    amount: 0,
    currencyType: CurrencyType.ARS,
    date: "2026-06-10",
    status: "Pendiente" as Loan["status"],
    payments: [],
    createdAt: "2026-06-10",
    ...overrides,
  };
}

function makeInvestment(overrides: Partial<Investment> = {}): Investment {
  return {
    id: `inv-${Math.random()}`,
    name: "Test",
    type: "Otra" as Investment["type"],
    currencyType: CurrencyType.ARS,
    status: "Activa",
    movements: [],
    currentValue: 0,
    lastUpdated: "2026-06-10",
    createdAt: "2026-06-01",
    ...overrides,
  } as Investment;
}

describe("computeCashEffect sign table (source of truth: calculateDualBalances L471-547)", () => {
  // --- currency conversions ---
  it("currency_ars_to_usd in range: ARS delta = -arsAmount", () => {
    const t = makeTransfer({ type: "currency_ars_to_usd", arsAmount: 362500, usdAmount: 250 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, transfers: [t] }))).toBe(-362500);
  });

  it("currency_ars_to_usd in range: USD delta = +usdAmount", () => {
    const t = makeTransfer({ type: "currency_ars_to_usd", arsAmount: 362500, usdAmount: 250 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.USD, transfers: [t] }))).toBe(250);
  });

  it("currency_usd_to_ars in range: ARS delta = +arsAmount", () => {
    const t = makeTransfer({ type: "currency_usd_to_ars", arsAmount: 100000, usdAmount: 70 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, transfers: [t] }))).toBe(100000);
  });

  it("currency_usd_to_ars in range: USD delta = -usdAmount", () => {
    const t = makeTransfer({ type: "currency_usd_to_ars", arsAmount: 100000, usdAmount: 70 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.USD, transfers: [t] }))).toBe(-70);
  });

  // --- cash_out ---
  it("cash_out currency=ARS in range: ARS delta = -amount, USD delta = 0", () => {
    const t = makeTransfer({ type: "cash_out", currency: "ARS", amount: 5000 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, transfers: [t] }))).toBe(-5000);
    expect(computeCashEffect(makeInput({ currency: CurrencyType.USD, transfers: [t] }))).toBe(0);
  });

  it("cash_out currency=USD in range: USD delta = -amount, ARS delta = 0", () => {
    const t = makeTransfer({ type: "cash_out", currency: "USD", amount: 40 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.USD, transfers: [t] }))).toBe(-40);
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, transfers: [t] }))).toBe(0);
  });

  // --- cash_in ---
  it("cash_in currency=ARS in range: ARS delta = +amount, USD delta = 0", () => {
    const t = makeTransfer({ type: "cash_in", currency: "ARS", amount: 8000 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, transfers: [t] }))).toBe(8000);
    expect(computeCashEffect(makeInput({ currency: CurrencyType.USD, transfers: [t] }))).toBe(0);
  });

  it("cash_in currency=USD in range: USD delta = +amount, ARS delta = 0", () => {
    const t = makeTransfer({ type: "cash_in", currency: "USD", amount: 55 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.USD, transfers: [t] }))).toBe(55);
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, transfers: [t] }))).toBe(0);
  });

  // --- usdPurchase ---
  it("usdPurchase origin=tracked in range: ARS delta = -arsAmount, USD delta = +usdAmount", () => {
    const p = makeUsdPurchase({ origin: "tracked", arsAmount: 145000, usdAmount: 100 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, usdPurchases: [p] }))).toBe(-145000);
    expect(computeCashEffect(makeInput({ currency: CurrencyType.USD, usdPurchases: [p] }))).toBe(100);
  });

  it("usdPurchase origin=untracked in range: ARS delta = 0 (no deduction), USD delta = +usdAmount", () => {
    const p = makeUsdPurchase({ origin: "untracked", arsAmount: 145000, usdAmount: 100 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, usdPurchases: [p] }))).toBe(0);
    expect(computeCashEffect(makeInput({ currency: CurrencyType.USD, usdPurchases: [p] }))).toBe(100);
  });

  // --- loans preste ---
  it("loan preste (same currency): loan.date in range -> -amount; payment in range -> +payment.amount", () => {
    const loan = makeLoan({
      type: "preste",
      currencyType: CurrencyType.ARS,
      amount: 50000,
      payments: [{ date: "2026-06-15", amount: 20000 }],
    });
    // -50000 + 20000 = -30000
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, loans: [loan] }))).toBe(-30000);
  });

  // --- loans debo ---
  it("loan debo (same currency): payments in range -> -payment.amount; principal -> 0", () => {
    const loan = makeLoan({
      type: "debo",
      currencyType: CurrencyType.ARS,
      amount: 50000, // principal must NOT move liquid
      payments: [{ date: "2026-06-15", amount: 12000 }],
    });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, loans: [loan] }))).toBe(-12000);
  });

  it("loan of different currency is ignored", () => {
    const loan = makeLoan({ type: "preste", currencyType: CurrencyType.USD, amount: 100, payments: [] });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, loans: [loan] }))).toBe(0);
  });

  // --- adjustments EXCLUDED ---
  it("adjustment_ars is EXCLUDED (delta contribution = 0)", () => {
    const t = makeTransfer({ type: "adjustment_ars", amount: 4100000 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, transfers: [t] }))).toBe(0);
  });

  it("adjustment_usd is EXCLUDED (delta contribution = 0)", () => {
    const t = makeTransfer({ type: "adjustment_usd", amount: 5000 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.USD, transfers: [t] }))).toBe(0);
  });

  // --- investment movements as cash ---
  it("investment aporte (same currency, !isInitial, !pendingIngreso, in range): delta = -amount", () => {
    const inv = makeInvestment({
      currencyType: CurrencyType.ARS,
      movements: [{ id: "m1", date: "2026-06-10", type: "aporte", amount: 30000 }],
    });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, investments: [inv] }))).toBe(-30000);
  });

  it("investment retiro (in range): delta = +(receivedAmount ?? amount)", () => {
    const inv = makeInvestment({
      currencyType: CurrencyType.ARS,
      movements: [{ id: "m2", date: "2026-06-10", type: "retiro", amount: 30000, receivedAmount: 28000 }],
    });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, investments: [inv] }))).toBe(28000);
  });

  it("investment retiro without receivedAmount falls back to amount", () => {
    const inv = makeInvestment({
      currencyType: CurrencyType.ARS,
      movements: [{ id: "m3", date: "2026-06-10", type: "retiro", amount: 15000 }],
    });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, investments: [inv] }))).toBe(15000);
  });

  it("investment isInitial and pendingIngreso movements are skipped", () => {
    const inv = makeInvestment({
      currencyType: CurrencyType.ARS,
      movements: [
        { id: "m4", date: "2026-06-10", type: "aporte", amount: 5000, isInitial: true },
        { id: "m5", date: "2026-06-10", type: "retiro", amount: 7000, pendingIngreso: true },
      ],
    });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, investments: [inv] }))).toBe(0);
  });

  it("investment of different currency is ignored", () => {
    const inv = makeInvestment({
      currencyType: CurrencyType.USD,
      movements: [{ id: "m6", date: "2026-06-10", type: "aporte", amount: 100 }],
    });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, investments: [inv] }))).toBe(0);
  });

  // --- out of range ---
  it("out-of-range movements contribute 0 across all types", () => {
    const t = makeTransfer({ type: "currency_ars_to_usd", arsAmount: 362500, usdAmount: 250 });
    const p = makeUsdPurchase({ origin: "tracked", arsAmount: 145000, usdAmount: 100 });
    const loan = makeLoan({ type: "preste", currencyType: CurrencyType.ARS, amount: 50000, payments: [{ date: "2026-06-15", amount: 20000 }] });
    const inv = makeInvestment({ currencyType: CurrencyType.ARS, movements: [{ id: "m7", date: "2026-06-10", type: "aporte", amount: 30000 }] });
    const input = makeInput({ currency: CurrencyType.ARS, isInRange: outOfRange, transfers: [t], usdPurchases: [p], loans: [loan], investments: [inv] });
    // loan principal/payments and inv movements are gated by isInRange too
    expect(computeCashEffect(input)).toBe(0);
  });

  // --- ANCHOR (the June $362.500 case) ---
  it("ANCHOR: June currency_ars_to_usd 362500 -> ARS -362500 and USD +250", () => {
    const t = makeTransfer({ type: "currency_ars_to_usd", date: "2026-06-04", arsAmount: 362500, usdAmount: 250 });
    expect(computeCashEffect(makeInput({ currency: CurrencyType.ARS, transfers: [t] }))).toBe(-362500);
    expect(computeCashEffect(makeInput({ currency: CurrencyType.USD, transfers: [t] }))).toBe(250);
  });
});
