import { describe, it, expect } from "vitest";
import { CurrencyType } from "@/constants/investments";
import type { Investment, InvestmentMovement, InvestmentPurpose } from "@/hooks/useMoneyTracker";
import { computeBuckets } from "./buckets";

let counter = 0;

function makeMovement(overrides: Partial<InvestmentMovement> = {}): InvestmentMovement {
  return {
    id: `mov-${counter++}`,
    date: "2026-06-10",
    type: "aporte",
    amount: 100,
    ...overrides,
  };
}

function makeInvestment(overrides: Partial<Investment> = {}): Investment {
  return {
    id: `inv-${counter++}`,
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

function bucketOf(inv: Investment, purpose: InvestmentPurpose) {
  return computeBuckets(inv).buckets.find((b) => b.purpose === purpose)!;
}

describe("computeBuckets", () => {
  it("SBS buckets: ahorro counts isInitial aporte; tarjeta = aportes - retiros", () => {
    const sbs = makeInvestment({
      purpose: "ahorro",
      currentValue: 231607,
      movements: [
        makeMovement({ type: "aporte", amount: 200977, isInitial: true, purpose: "ahorro" }),
        makeMovement({ type: "aporte", amount: 344723, purpose: "tarjeta" }),
        makeMovement({ type: "retiro", amount: 314093, purpose: "tarjeta" }),
      ],
    });
    expect(bucketOf(sbs, "ahorro").amount).toBe(200977);
    expect(bucketOf(sbs, "tarjeta").amount).toBe(30630);
    expect(bucketOf(sbs, "objetivo").amount).toBe(0);
    expect(bucketOf(sbs, "especulacion").amount).toBe(0);
  });

  it("negative bucket: a retiro without matching aportes yields negative amount + flag", () => {
    const inv = makeInvestment({
      purpose: "ahorro",
      movements: [makeMovement({ type: "retiro", amount: 100, purpose: "tarjeta" })],
    });
    const tarjeta = bucketOf(inv, "tarjeta");
    expect(tarjeta.amount).toBe(-100);
    expect(tarjeta.negative).toBe(true);
  });

  it("inheritance: movement without purpose uses investment.purpose; without either falls to ahorro", () => {
    const inheritsInvestment = makeInvestment({
      purpose: "objetivo",
      movements: [makeMovement({ type: "aporte", amount: 500 })], // no movement purpose
    });
    expect(bucketOf(inheritsInvestment, "objetivo").amount).toBe(500);

    const noPurposeAnywhere = makeInvestment({
      purpose: undefined,
      movements: [makeMovement({ type: "aporte", amount: 700 })],
    });
    expect(bucketOf(noPurposeAnywhere, "ahorro").amount).toBe(700);
  });

  it("sinAsignar = currentValue - total", () => {
    const inv = makeInvestment({
      purpose: "ahorro",
      currentValue: 243402.78,
      movements: [
        makeMovement({ type: "aporte", amount: 200977, purpose: "ahorro" }),
        makeMovement({ type: "aporte", amount: 30630, purpose: "tarjeta" }),
      ],
    });
    const breakdown = computeBuckets(inv);
    expect(breakdown.total).toBe(231607);
    expect(breakdown.sinAsignar).toBeCloseTo(11795.78, 2);
  });

  it("pending retiros do NOT reduce their bucket (money has not left)", () => {
    const inv = makeInvestment({
      purpose: "ahorro",
      movements: [
        makeMovement({ type: "aporte", amount: 1000, purpose: "tarjeta" }),
        makeMovement({ type: "retiro", amount: 400, pendingIngreso: true, purpose: "tarjeta" }),
      ],
    });
    expect(bucketOf(inv, "tarjeta").amount).toBe(1000);
  });
});
