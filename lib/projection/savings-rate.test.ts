import { describe, it, expect } from "vitest";
import {
  computeSavingsEstimate,
  DEFAULT_SAVINGS_CONFIG,
  SAVINGS_RATE_KEY,
} from "./savings-rate";
import type { SavingsRateConfig, SavingsEstimateInput } from "./savings-rate";

describe("computeSavingsEstimate", () => {
  describe("auto mode", () => {
    it("returns positive averageNetFlow as-is", () => {
      const input: SavingsEstimateInput = {
        config: { mode: "auto" },
        currentSalary: 500000,
        averageNetFlow: 120000,
      };
      expect(computeSavingsEstimate(input)).toBe(120000);
    });

    it("clamps negative averageNetFlow to 0", () => {
      const input: SavingsEstimateInput = {
        config: { mode: "auto" },
        currentSalary: 500000,
        averageNetFlow: -50000,
      };
      expect(computeSavingsEstimate(input)).toBe(0);
    });

    it("returns 0 for zero averageNetFlow", () => {
      const input: SavingsEstimateInput = {
        config: { mode: "auto" },
        currentSalary: 500000,
        averageNetFlow: 0,
      };
      expect(computeSavingsEstimate(input)).toBe(0);
    });
  });

  describe("percentage mode", () => {
    it("returns 30% of salary 500000 as 150000", () => {
      const input: SavingsEstimateInput = {
        config: { mode: "percentage", percentage: 30 },
        currentSalary: 500000,
        averageNetFlow: 0,
      };
      expect(computeSavingsEstimate(input)).toBe(150000);
    });

    it("returns 0 for 0%", () => {
      const input: SavingsEstimateInput = {
        config: { mode: "percentage", percentage: 0 },
        currentSalary: 500000,
        averageNetFlow: 0,
      };
      expect(computeSavingsEstimate(input)).toBe(0);
    });

    it("returns full salary for 100%", () => {
      const input: SavingsEstimateInput = {
        config: { mode: "percentage", percentage: 100 },
        currentSalary: 500000,
        averageNetFlow: 0,
      };
      expect(computeSavingsEstimate(input)).toBe(500000);
    });

    it("returns 0 when salary is 0", () => {
      const input: SavingsEstimateInput = {
        config: { mode: "percentage", percentage: 30 },
        currentSalary: 0,
        averageNetFlow: 0,
      };
      expect(computeSavingsEstimate(input)).toBe(0);
    });
  });

  describe("fixed mode", () => {
    it("returns the exact fixed amount", () => {
      const input: SavingsEstimateInput = {
        config: { mode: "fixed", amount: 200000 },
        currentSalary: 500000,
        averageNetFlow: 0,
      };
      expect(computeSavingsEstimate(input)).toBe(200000);
    });

    it("returns 0 for fixed amount of 0", () => {
      const input: SavingsEstimateInput = {
        config: { mode: "fixed", amount: 0 },
        currentSalary: 500000,
        averageNetFlow: 0,
      };
      expect(computeSavingsEstimate(input)).toBe(0);
    });
  });

  describe("DEFAULT_SAVINGS_CONFIG", () => {
    it("defaults to auto mode", () => {
      expect(DEFAULT_SAVINGS_CONFIG).toEqual({ mode: "auto" });
    });
  });

  describe("SAVINGS_RATE_KEY", () => {
    it("is the expected localStorage key", () => {
      expect(SAVINGS_RATE_KEY).toBe("savingsRateConfig");
    });
  });
});
