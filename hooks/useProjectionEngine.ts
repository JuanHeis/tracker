"use client";

import { useMemo } from "react";
import { format, addMonths } from "date-fns";
import { es } from "date-fns/locale";

import type { MonthlyData } from "@/hooks/useMoneyTracker";
import type { SalaryEntry } from "@/hooks/useSalaryHistory";
import { getSalaryForMonth } from "@/hooks/useSalaryHistory";
import { CurrencyType } from "@/constants/investments";

import type {
  InvestmentProjection,
  ProjectionDataPoint,
  ProjectionSummary,
  UseProjectionEngineReturn,
  CustomAnnualRates,
} from "@/lib/projection/types";
import { SCENARIOS } from "@/lib/projection/types";
import {
  pfMonthlyRate,
  getDefaultMonthlyRate,
  projectInvestment,
  computeObservedMonthlyRate,
} from "@/lib/projection/compound-interest";
import { projectIncome } from "@/lib/projection/income-projection";
import { reconstructHistoricalPatrimony } from "@/lib/projection/patrimony-history";
import { projectPatrimonyScenarios } from "@/lib/projection/scenario-engine";
import type { Investment } from "@/hooks/useMoneyTracker";

/**
 * Compute total investment growth per month for a given rate multiplier.
 * Returns an array where index m = total growth at month m (value at m - value at 0).
 */
export function computeInvestmentGrowth(
  investments: Investment[],
  rateMultiplier: number,
  horizonMonths: number,
  includeContributions: boolean,
  globalUsdRate: number,
  customRates?: CustomAnnualRates,
  useRealRates?: boolean,
  contributionOverrides?: Record<string, number>
): { growth: number[]; projections: InvestmentProjection[] } {
  if (investments.length === 0) {
    return {
      growth: Array.from({ length: horizonMonths + 1 }, () => 0),
      projections: [],
    };
  }

  const projections = investments.map((inv) => {
    let rate: number;
    let rateSource: import("@/lib/projection/types").RateSource;
    if (useRealRates) {
      if (inv.tna != null) {
        rate = pfMonthlyRate(inv.tna) * rateMultiplier;
        rateSource = "tna";
      } else {
        const observedRate = computeObservedMonthlyRate(inv);
        if (observedRate != null) {
          rate = observedRate * rateMultiplier;
          rateSource = "observed";
        } else {
          rate = getDefaultMonthlyRate(inv.type, rateMultiplier, customRates);
          rateSource = customRates?.[inv.type] != null ? "custom" : "default";
        }
      }
    } else if (inv.type === "Plazo Fijo" && inv.tna != null) {
      rate = pfMonthlyRate(inv.tna) * rateMultiplier;
      rateSource = "tna";
    } else {
      rate = getDefaultMonthlyRate(inv.type, rateMultiplier, customRates);
      rateSource = customRates?.[inv.type] != null ? "custom" : "default";
    }
    return projectInvestment(inv, rate, horizonMonths, includeContributions, customRates, contributionOverrides?.[inv.id], rateSource);
  });

  // Sum projected values per month, converting USD to ARS
  let totalAtMonth0 = 0;
  for (const p of projections) {
    const value = p.projectedValues[0] || 0;
    totalAtMonth0 +=
      p.currencyType === CurrencyType.USD ? value * globalUsdRate : value;
  }

  const growth: number[] = [];
  for (let m = 0; m <= horizonMonths; m++) {
    let total = 0;
    for (const p of projections) {
      const value = p.projectedValues[m] || 0;
      total +=
        p.currencyType === CurrencyType.USD ? value * globalUsdRate : value;
    }
    growth.push(total - totalAtMonth0);
  }

  return { growth, projections };
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Orchestrator hook for all projection computations.
 * Pure computation via useMemo -- no useState, no localStorage writes.
 *
 * Receives data as parameters (not from other hooks) to stay decoupled and testable.
 */
export function useProjectionEngine(
  monthlyData: MonthlyData,
  salaryEntries: SalaryEntry[],
  monthlyNetSavings: number,
  globalUsdRate: number,
  options?: {
    horizonMonths?: number;
    includeContributions?: boolean;
    customAnnualRates?: CustomAnnualRates;
    useRealRates?: boolean;
    contributionOverrides?: Record<string, number>;
  }
): UseProjectionEngineReturn {
  const horizonMonths = options?.horizonMonths ?? 12;
  const includeContributions = options?.includeContributions ?? false;
  const customAnnualRates = options?.customAnnualRates;
  const useRealRates = options?.useRealRates ?? false;
  const contributionOverrides = options?.contributionOverrides;

  return useMemo(() => {
    // 1. Current month
    const currentMonth = format(new Date(), "yyyy-MM");

    // 2. Historical patrimony
    const historical = reconstructHistoricalPatrimony(
      monthlyData,
      salaryEntries,
      globalUsdRate
    );

    // 3. Current patrimony from last historical point
    const currentPatrimony =
      historical.length > 0
        ? historical[historical.length - 1].patrimony
        : 0;

    // 4. Current salary
    const overrides = monthlyData.salaryOverrides || {};
    const salaryResolution = getSalaryForMonth(
      currentMonth,
      salaryEntries,
      overrides
    );
    const currentSalary = salaryResolution.amount;

    // 5. Monthly net savings (passed in from caller via savingsRate.estimate)
    const netSavings = monthlyNetSavings;

    // 6. Income projection (flat-line for PROJ-03)
    const incomeProjection = projectIncome(currentSalary, horizonMonths);

    // 7. Active non-liquid investments
    const activeInvestments = monthlyData.investments.filter(
      (i) => i.status === "Activa" && !i.isLiquid
    );

    // 8. Investment projections + growth per scenario
    const baseResult = computeInvestmentGrowth(
      activeInvestments,
      1.0,
      horizonMonths,
      includeContributions,
      globalUsdRate,
      customAnnualRates,
      useRealRates,
      contributionOverrides
    );
    const investmentProjections = baseResult.projections;

    const optimistaGrowth = computeInvestmentGrowth(
      activeInvestments,
      1.5,
      horizonMonths,
      includeContributions,
      globalUsdRate,
      customAnnualRates,
      useRealRates,
      contributionOverrides
    ).growth;

    const pesimistaGrowth = computeInvestmentGrowth(
      activeInvestments,
      0.5,
      horizonMonths,
      includeContributions,
      globalUsdRate,
      customAnnualRates,
      useRealRates,
      contributionOverrides
    ).growth;

    // 9. Patrimony scenarios (savings only)
    const scenarioBase = projectPatrimonyScenarios(
      currentPatrimony,
      netSavings,
      horizonMonths
    );

    // 10. Combine savings + investment growth per scenario
    const finalOptimista = scenarioBase.optimista.map(
      (v, m) => v + optimistaGrowth[m]
    );
    const finalBase = scenarioBase.base.map(
      (v, m) => v + baseResult.growth[m]
    );
    const finalPesimista = scenarioBase.pesimista.map(
      (v, m) => v + pesimistaGrowth[m]
    );

    // 11. Build ProjectionDataPoint[] for chart
    const patrimonyData: ProjectionDataPoint[] = [];

    // Historical months
    for (const point of historical) {
      const isCurrentMonth = point.monthKey === currentMonth;
      patrimonyData.push({
        month: formatMonthLabel(point.monthKey),
        monthKey: point.monthKey,
        historicalPatrimony: point.patrimony,
        // Overlap point: current month has both historical and projections
        proyeccionOptimista: isCurrentMonth ? finalOptimista[0] : null,
        proyeccionBase: isCurrentMonth ? finalBase[0] : null,
        proyeccionPesimista: isCurrentMonth ? finalPesimista[0] : null,
      });
    }

    // If current month not in historical, add it as the bridge point
    const currentInHistorical = historical.some(
      (p) => p.monthKey === currentMonth
    );
    if (!currentInHistorical) {
      patrimonyData.push({
        month: formatMonthLabel(currentMonth),
        monthKey: currentMonth,
        historicalPatrimony: currentPatrimony > 0 ? currentPatrimony : null,
        proyeccionOptimista: finalOptimista[0],
        proyeccionBase: finalBase[0],
        proyeccionPesimista: finalPesimista[0],
      });
    }

    // Future months (starting from month 1)
    const now = new Date();
    for (let m = 1; m <= horizonMonths; m++) {
      const futureDate = addMonths(now, m);
      const monthKey = format(futureDate, "yyyy-MM");
      patrimonyData.push({
        month: capitalize(format(futureDate, "MMM yy", { locale: es })),
        monthKey,
        historicalPatrimony: null,
        proyeccionOptimista: finalOptimista[m],
        proyeccionBase: finalBase[m],
        proyeccionPesimista: finalPesimista[m],
      });
    }

    // 12. Current month index
    const currentMonthIndex = patrimonyData.findIndex(
      (p) => p.monthKey === currentMonth
    );

    // 13. Projected patrimony at horizon
    const projectedPatrimony: ProjectionSummary = {
      optimista: finalOptimista[horizonMonths],
      base: finalBase[horizonMonths],
      pesimista: finalPesimista[horizonMonths],
    };

    return {
      patrimonyData,
      investmentProjections,
      currentMonthIndex: currentMonthIndex >= 0 ? currentMonthIndex : 0,
      currentPatrimony,
      projectedPatrimony,
      incomeProjection,
      horizonMonths,
    };
  }, [
    monthlyData,
    salaryEntries,
    monthlyNetSavings,
    globalUsdRate,
    horizonMonths,
    includeContributions,
    customAnnualRates,
    useRealRates,
    contributionOverrides,
  ]);
}

/**
 * Format a "yyyy-MM" month key into a display label like "Ene 26".
 */
function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return capitalize(format(date, "MMM yy", { locale: es }));
}
