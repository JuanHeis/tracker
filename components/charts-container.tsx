"use client";

import { useState } from "react";
import { MonthlyData } from "@/hooks/useMoneyTracker";
import type { SalaryEntry } from "@/hooks/useSalaryHistory";
import type { RecurringExpense } from "@/hooks/useRecurringExpenses";
import { useProjectionEngine } from "@/hooks/useProjectionEngine";
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
  recurringExpenses: RecurringExpense[];
  globalUsdRate: number;
}

export default function ChartsContainer({
  monthlyData,
  selectedYear,
  salaryEntries,
  recurringExpenses,
  globalUsdRate,
}: ChartsContainerProps) {
  const [horizonMonths, setHorizonMonths] = useState(12);
  const [includeContributions, setIncludeContributions] = useState(false);
  const [visibleScenarios, setVisibleScenarios] = useState({
    optimista: true,
    base: true,
    pesimista: true,
  });

  const projection = useProjectionEngine(
    monthlyData,
    salaryEntries,
    recurringExpenses,
    globalUsdRate,
    { horizonMonths, includeContributions }
  );

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
        onToggleContributions={() => setIncludeContributions((prev) => !prev)}
        investments={monthlyData.investments.filter(
          (i) => i.status === "Activa" && !i.isLiquid
        )}
      />
      <ChartDisclaimer globalUsdRate={globalUsdRate} />
    </div>
  );
}
