"use client";

import { useState } from "react";
import { MonthlyData } from "@/hooks/useMoneyTracker";
import type { SalaryEntry } from "@/hooks/useSalaryHistory";
import { useProjectionEngine } from "@/hooks/useProjectionEngine";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { CustomAnnualRates } from "@/lib/projection/types";
import { ExpensesByMonth } from "./charts/expenses-by-month";
import { SalaryByMonth } from "./charts/salary-by-month";
import { PatrimonyChart } from "./charts/patrimony-chart";
import { ChartControls } from "./charts/chart-controls";
import { ChartDisclaimer } from "./charts/chart-disclaimer";
import { InvestmentChart } from "./charts/investment-chart";

interface ChartsContainerProps {
  monthlyData: MonthlyData;
  selectedYear: string;
  salaryEntries: SalaryEntry[];
  monthlyNetSavings: number;
  globalUsdRate: number;
}

export default function ChartsContainer({
  monthlyData,
  selectedYear,
  salaryEntries,
  monthlyNetSavings,
  globalUsdRate,
}: ChartsContainerProps) {
  const [customAnnualRates] = useLocalStorage<CustomAnnualRates>("customAnnualRates", {});
  const [useRealRates, setUseRealRates] = useState(false);
  const [horizonMonths, setHorizonMonths] = useState(12);
  const [includeContributions, setIncludeContributions] = useState(false);
  const [contributionOverrides, setContributionOverrides] = useState<Record<string, number>>({});
  const [visibleScenarios, setVisibleScenarios] = useState({
    optimista: true,
    base: true,
    pesimista: true,
  });

  const projection = useProjectionEngine(
    monthlyData,
    salaryEntries,
    monthlyNetSavings,
    globalUsdRate,
    { horizonMonths, includeContributions, customAnnualRates, useRealRates, contributionOverrides }
  );

  const handleContributionOverrideChange = (investmentId: string, value: number) => {
    setContributionOverrides((prev) => ({ ...prev, [investmentId]: value }));
  };

  const handleToggleContributions = () => {
    setIncludeContributions((prev) => {
      if (prev) {
        // Toggling OFF — clear overrides
        setContributionOverrides({});
      }
      return !prev;
    });
  };

  const handleToggleScenario = (
    s: "optimista" | "base" | "pesimista"
  ) => {
    setVisibleScenarios((prev) => ({ ...prev, [s]: !prev[s] }));
  };

  return (
    <div className="space-y-8">
      <ExpensesByMonth monthlyData={monthlyData} selectedYear={selectedYear} />
      <SalaryByMonth monthlyData={monthlyData} selectedYear={selectedYear} />
      <ChartControls
        horizonMonths={horizonMonths}
        onHorizonChange={setHorizonMonths}
        visibleScenarios={visibleScenarios}
        onToggleScenario={handleToggleScenario}
      />
      <PatrimonyChart
        data={projection.patrimonyData}
        currentMonthIndex={projection.currentMonthIndex}
        visibleScenarios={visibleScenarios}
      />
      <ChartDisclaimer globalUsdRate={globalUsdRate} />
      <InvestmentChart
        projections={projection.investmentProjections}
        monthLabels={projection.patrimonyData
          .slice(projection.currentMonthIndex)
          .map((p) => p.month)}
        globalUsdRate={globalUsdRate}
        includeContributions={includeContributions}
        onToggleContributions={handleToggleContributions}
        contributionOverrides={contributionOverrides}
        onContributionOverrideChange={handleContributionOverrideChange}
        investments={monthlyData.investments.filter(
          (i) => i.status === "Activa" && !i.isLiquid
        )}
        useRealRates={useRealRates}
        onToggleRealRates={() => setUseRealRates((prev) => !prev)}
      />
      <ChartDisclaimer globalUsdRate={globalUsdRate} />
    </div>
  );
}
