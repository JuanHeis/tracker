import { describe, it, expect } from "vitest";
import { calculateMonthlyNetFlow, averageMonthlyNetFlow } from "./net-flow";
import type { HistoricalPoint } from "./types";

describe("calculateMonthlyNetFlow", () => {
  it("returns empty array for empty input", () => {
    expect(calculateMonthlyNetFlow([])).toEqual([]);
  });

  it("returns empty array for single historical point", () => {
    const points: HistoricalPoint[] = [{ monthKey: "2026-01", patrimony: 100000 }];
    expect(calculateMonthlyNetFlow(points)).toEqual([]);
  });

  it("computes net flow as delta between consecutive months", () => {
    const points: HistoricalPoint[] = [
      { monthKey: "2026-01", patrimony: 100000 },
      { monthKey: "2026-02", patrimony: 150000 },
      { monthKey: "2026-03", patrimony: 130000 },
    ];
    const result = calculateMonthlyNetFlow(points);
    expect(result).toEqual([
      { monthKey: "2026-02", netFlow: 50000 },
      { monthKey: "2026-03", netFlow: -20000 },
    ]);
  });

  it("returns N-1 entries for N historical points", () => {
    const points: HistoricalPoint[] = [
      { monthKey: "2026-01", patrimony: 100000 },
      { monthKey: "2026-02", patrimony: 200000 },
      { monthKey: "2026-03", patrimony: 250000 },
      { monthKey: "2026-04", patrimony: 300000 },
    ];
    expect(calculateMonthlyNetFlow(points)).toHaveLength(3);
  });

  it("handles negative patrimony deltas (overspending)", () => {
    const points: HistoricalPoint[] = [
      { monthKey: "2026-01", patrimony: 500000 },
      { monthKey: "2026-02", patrimony: 300000 },
    ];
    const result = calculateMonthlyNetFlow(points);
    expect(result[0].netFlow).toBe(-200000);
  });
});

describe("averageMonthlyNetFlow", () => {
  it("returns 0 for empty array", () => {
    expect(averageMonthlyNetFlow([])).toBe(0);
  });

  it("computes mean of all entries when lastN not provided", () => {
    const flows = [
      { monthKey: "2026-02", netFlow: 50000 },
      { monthKey: "2026-03", netFlow: 30000 },
      { monthKey: "2026-04", netFlow: 40000 },
    ];
    // mean = (50000+30000+40000)/3 = 40000
    expect(averageMonthlyNetFlow(flows)).toBe(40000);
  });

  it("only averages the last N entries when lastN is provided", () => {
    const flows = [
      { monthKey: "2026-02", netFlow: 10000 },
      { monthKey: "2026-03", netFlow: 20000 },
      { monthKey: "2026-04", netFlow: 50000 },
      { monthKey: "2026-05", netFlow: 60000 },
      { monthKey: "2026-06", netFlow: 70000 },
    ];
    // last 3: 50000, 60000, 70000 => mean = 60000
    expect(averageMonthlyNetFlow(flows, 3)).toBe(60000);
  });

  it("uses all entries if fewer than lastN", () => {
    const flows = [
      { monthKey: "2026-02", netFlow: 10000 },
      { monthKey: "2026-03", netFlow: 30000 },
    ];
    // lastN=5 but only 2 entries => mean = (10000+30000)/2 = 20000
    expect(averageMonthlyNetFlow(flows, 5)).toBe(20000);
  });

  it("can return negative values (net outflow)", () => {
    const flows = [
      { monthKey: "2026-02", netFlow: -50000 },
      { monthKey: "2026-03", netFlow: -30000 },
    ];
    // mean = -40000
    expect(averageMonthlyNetFlow(flows)).toBe(-40000);
  });

  it("rounds result to integer", () => {
    const flows = [
      { monthKey: "2026-02", netFlow: 10000 },
      { monthKey: "2026-03", netFlow: 10001 },
    ];
    // mean = 10000.5 => rounded = 10001
    expect(averageMonthlyNetFlow(flows)).toBe(10001);
  });
});
