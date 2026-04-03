"use client";

import { useHydration } from "@/hooks/useHydration";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { InvestmentProjection } from "@/lib/projection/types";
import { CurrencyType } from "@/constants/investments";

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
}: InvestmentChartProps) {
  const isHydrated = useHydration();

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

  const { data, typeEntries } = buildInvestmentChartData(
    projections,
    monthLabels,
    globalUsdRate
  );

  const chartConfig: ChartConfig = {};
  typeEntries.forEach((entry, i) => {
    chartConfig[entry.slug] = {
      label: entry.label,
      color: CHART_COLORS[i % CHART_COLORS.length],
    };
  });

  const xAxisInterval =
    data.length <= 8 ? 0 : data.length <= 14 ? 1 : 2;

  return (
    <Card className="m-0 border-none shadow-none p-0">
      <CardHeader className="px-0">
        <CardTitle>Proyeccion de Inversiones</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
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
      </CardContent>
    </Card>
  );
}
