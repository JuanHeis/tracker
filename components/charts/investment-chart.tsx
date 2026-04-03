"use client";

import { useState } from "react";
import { useHydration } from "@/hooks/useHydration";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import type { InvestmentProjection } from "@/lib/projection/types";
import type { Investment } from "@/hooks/useMoneyTracker";
import { CurrencyType } from "@/constants/investments";
import { AlertTriangle } from "lucide-react";
import { InvestmentBasisInfo } from "./investment-basis-info";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

function toSlug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-");
}

interface InvestmentChartProps {
  projections: InvestmentProjection[];
  monthLabels: string[];
  globalUsdRate: number;
  includeContributions: boolean;
  onToggleContributions: () => void;
  investments: Investment[];
  useRealRates: boolean;
  onToggleRealRates: () => void;
}

function buildInvestmentChartData(
  projections: InvestmentProjection[],
  monthLabels: string[],
  globalUsdRate: number
): {
  data: Record<string, number | string>[];
  typeEntries: { slug: string; label: string }[];
} {
  const uniqueTypes = Array.from(new Set(projections.map((p) => p.type)));
  const typeEntries = uniqueTypes.map((t) => ({ slug: toSlug(t), label: t }));
  const monthCount = projections[0]?.projectedValues.length ?? 0;
  const data: Record<string, number | string>[] = [];

  for (let i = 0; i < monthCount; i++) {
    const point: Record<string, number | string> = {
      month: monthLabels[i] || `M${i}`,
    };
    for (const entry of typeEntries) {
      const total = projections
        .filter((p) => p.type === entry.label)
        .reduce((sum, p) => {
          const value = p.projectedValues[i] ?? 0;
          return (
            sum +
            (p.currencyType === CurrencyType.USD
              ? value * globalUsdRate
              : value)
          );
        }, 0);
      point[entry.slug] = Math.round(total);
    }
    data.push(point);
  }

  return { data, typeEntries };
}

export function InvestmentChart({
  projections,
  monthLabels,
  globalUsdRate,
  includeContributions,
  onToggleContributions,
  investments,
  useRealRates,
  onToggleRealRates,
}: InvestmentChartProps) {
  const isHydrated = useHydration();
  const [visibleTypes, setVisibleTypes] = useState<Record<string, boolean>>({});

  if (!isHydrated) {
    return <div className="aspect-video animate-pulse bg-muted rounded-lg" />;
  }

  if (projections.length === 0) {
    return (
      <Card className="m-0 border-none shadow-none p-0">
        <CardHeader className="px-0">
          <CardTitle>Proyeccion de Inversiones</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay inversiones activas para proyectar
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasAnyContributions = investments.some((inv) =>
    inv.movements.some((m) => m.type === "aporte" && !m.isInitial)
  );

  const uniqueTypes = Array.from(new Set(projections.map((p) => p.type)));

  const filteredProjections = projections.filter(
    (p) => visibleTypes[p.type] !== false
  );

  const handleToggleType = (type: string) => {
    setVisibleTypes((prev) => ({
      ...prev,
      [type]: prev[type] === false ? true : false,
    }));
  };

  const { data, typeEntries } = buildInvestmentChartData(
    filteredProjections,
    monthLabels,
    globalUsdRate
  );

  const chartConfig: ChartConfig = {};
  // Build config from ALL types (not filtered) so colors stay consistent
  const allTypeEntries = uniqueTypes.map((t) => ({ slug: toSlug(t), label: t }));
  allTypeEntries.forEach((entry, i) => {
    chartConfig[entry.slug] = {
      label: entry.label,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });

  const xAxisInterval =
    data.length <= 8 ? 0 : data.length <= 14 ? 1 : 2;

  return (
    <Card className="m-0 border-none shadow-none p-0">
      <CardHeader className="px-0 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle>Proyeccion de Inversiones</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={useRealRates ? "default" : "outline"}
              onClick={onToggleRealRates}
            >
              {useRealRates ? "Tasas reales" : "Tasas por defecto"}
            </Button>
            <Button
              size="sm"
              variant={includeContributions ? "default" : "outline"}
              onClick={onToggleContributions}
            >
              {includeContributions ? "Con aportes" : "Sin aportes"}
            </Button>
          </div>
        </div>
        {includeContributions && !hasAnyContributions && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2 mx-0">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              Ninguna inversion tiene aportes mensuales configurados. Agrega
              movimientos de tipo &quot;aporte&quot; para ver el efecto.
            </span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {uniqueTypes.map((type, i) => (
            <Button
              key={type}
              size="sm"
              variant={visibleTypes[type] !== false ? "default" : "outline"}
              onClick={() => handleToggleType(type)}
              className="h-7 text-xs"
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1"
                style={{
                  background: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
              {type}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {filteredProjections.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Selecciona al menos un tipo de inversion
          </p>
        ) : (
          <ChartContainer config={chartConfig}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="month"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={xAxisInterval}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              {typeEntries.map((entry) => (
                <Area
                  key={entry.slug}
                  type="monotone"
                  dataKey={entry.slug}
                  stackId="investments"
                  stroke={`var(--color-${entry.slug})`}
                  fill={`var(--color-${entry.slug})`}
                  fillOpacity={0.4}
                  isAnimationActive={false}
                />
              ))}
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      `$${Number(value).toLocaleString("es-AR")}`
                    }
                  />
                }
                cursor={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
        {filteredProjections.length > 0 && (
          <InvestmentBasisInfo
            projections={filteredProjections}
            investments={investments}
          />
        )}
      </CardContent>
    </Card>
  );
}
