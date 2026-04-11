"use client";

import { useState, useMemo } from "react";
import type { WaterfallBar } from "@/lib/projection/waterfall";
import type { SavingsRateConfig } from "@/lib/projection/savings-rate";
import type { ProjectionSummary } from "@/lib/projection/types";
import { projectPatrimonyScenarios } from "@/lib/projection/scenario-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WaterfallChart } from "@/components/charts/waterfall-chart";
import { SavingsRateSelector } from "@/components/savings-rate-selector";
import { MiniProjectionChart } from "@/components/charts/mini-projection-chart";

const formatArs = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export interface MonthlyFlowPanelProps {
  // Waterfall data (from useMonthlyFlowData)
  waterfallData: WaterfallBar[];
  // Savings rate (from useSavingsRate, passed through)
  savingsRateConfig: SavingsRateConfig;
  onSavingsRateConfigChange: (config: SavingsRateConfig) => void;
  savingsEstimate: number;
  currentSalary: number;
  averageNetFlow: number;
  // Mini-projection data (from useProjectionEngine, 12-month horizon)
  currentPatrimony: number;
  projectedPatrimony: ProjectionSummary;
  projectionData: {
    month: string;
    optimista: number;
    base: number;
    pesimista: number;
  }[];
}

export function MonthlyFlowPanel({
  waterfallData,
  savingsRateConfig,
  onSavingsRateConfigChange,
  savingsEstimate,
  currentSalary,
  averageNetFlow,
  currentPatrimony,
  projectedPatrimony,
  projectionData,
}: MonthlyFlowPanelProps) {
  const [simulatedAmount, setSimulatedAmount] = useState(0);

  // Adjust waterfall Libre bar when simulation is active (D-09)
  const adjustedWaterfallData = useMemo(() => {
    if (simulatedAmount <= 0 || waterfallData.length === 0)
      return waterfallData;

    const adjusted = waterfallData.map((bar) => ({ ...bar }));
    const libreIdx = adjusted.findIndex((b) => b.name === "Libre");
    if (libreIdx === -1) return adjusted;

    const libre = adjusted[libreIdx];
    const newLibreAmount = libre.amount - simulatedAmount;
    adjusted[libreIdx] = {
      ...libre,
      amount: newLibreAmount,
      barBottom: Math.min(0, newLibreAmount),
      barTop: Math.max(0, newLibreAmount),
    };
    return adjusted;
  }, [waterfallData, simulatedAmount]);

  // Adjust projection when simulation is active (D-09)
  const adjustedProjectionData = useMemo(() => {
    if (simulatedAmount <= 0)
      return { data: projectionData, projected: projectedPatrimony };

    const adjustedSavings = savingsEstimate - simulatedAmount;
    const scenarios = projectPatrimonyScenarios(
      currentPatrimony,
      adjustedSavings,
      12
    );
    const data = projectionData.map((point, i) => ({
      month: point.month,
      optimista: scenarios.optimista[i] ?? point.optimista,
      base: scenarios.base[i] ?? point.base,
      pesimista: scenarios.pesimista[i] ?? point.pesimista,
    }));
    const projected: ProjectionSummary = {
      optimista: scenarios.optimista[12],
      base: scenarios.base[12],
      pesimista: scenarios.pesimista[12],
    };
    return { data, projected };
  }, [
    projectionData,
    projectedPatrimony,
    simulatedAmount,
    savingsEstimate,
    currentPatrimony,
  ]);

  // Impact text values (D-10)
  const originalLibre =
    waterfallData.find((b) => b.name === "Libre")?.amount ?? 0;
  const adjustedLibre =
    adjustedWaterfallData.find((b) => b.name === "Libre")?.amount ?? 0;

  return (
    <div className="space-y-4">
      {/* Section 1: Waterfall Chart */}
      <WaterfallChart data={adjustedWaterfallData} />

      {/* Section 2: Savings Rate Selector */}
      <SavingsRateSelector
        config={savingsRateConfig}
        onConfigChange={onSavingsRateConfigChange}
        estimate={savingsEstimate}
        currentSalary={currentSalary}
        averageNetFlow={averageNetFlow}
      />

      {/* Section 3: Mini-Projection */}
      <Card>
        <CardContent className="pt-4">
          <MiniProjectionChart
            data={adjustedProjectionData.data}
            projectedPatrimony={adjustedProjectionData.projected}
          />
        </CardContent>
      </Card>

      {/* Section 4: Inline Simulation */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <label className="text-sm font-medium">
            Gasto hipotetico mensual
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={simulatedAmount || ""}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSimulatedAmount(isNaN(val) || val < 0 ? 0 : val);
              }}
              className="h-8 text-sm"
            />
          </div>
          {simulatedAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              Libre baja de {formatArs(originalLibre)} a{" "}
              {formatArs(adjustedLibre)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
