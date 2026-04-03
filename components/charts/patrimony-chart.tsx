"use client";

import { useHydration } from "@/hooks/useHydration";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { ProjectionDataPoint } from "@/lib/projection/types";

const chartConfig = {
  historicalPatrimony: {
    label: "Historico",
    color: "hsl(var(--chart-1))",
  },
  proyeccionOptimista: {
    label: "Optimista",
    color: "hsl(var(--chart-2))",
  },
  proyeccionBase: {
    label: "Base",
    color: "hsl(var(--chart-1))",
  },
  proyeccionPesimista: {
    label: "Pesimista",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface PatrimonyChartProps {
  data: ProjectionDataPoint[];
  currentMonthIndex: number;
  visibleScenarios: { optimista: boolean; base: boolean; pesimista: boolean };
}

export function PatrimonyChart({
  data,
  currentMonthIndex,
  visibleScenarios,
}: PatrimonyChartProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return <div className="aspect-video animate-pulse bg-muted rounded-lg" />;
  }

  const xAxisInterval =
    data.length <= 8 ? 0 : data.length <= 14 ? 1 : 2;

  return (
    <Card className="m-0 border-none shadow-none p-0">
      <CardHeader className="px-0">
        <CardTitle>Proyeccion Patrimonial</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ChartContainer config={chartConfig}>
          <ComposedChart data={data}>
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
            <ReferenceLine
              x={data[currentMonthIndex]?.month}
              stroke="#888"
              strokeDasharray="3 3"
              label={{ value: "Hoy", position: "top", fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="historicalPatrimony"
              stroke="var(--color-historicalPatrimony)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            {visibleScenarios.optimista && (
              <Line
                type="monotone"
                dataKey="proyeccionOptimista"
                stroke="var(--color-proyeccionOptimista)"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            )}
            {visibleScenarios.base && (
              <Line
                type="monotone"
                dataKey="proyeccionBase"
                stroke="var(--color-proyeccionBase)"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            )}
            {visibleScenarios.pesimista && (
              <Line
                type="monotone"
                dataKey="proyeccionPesimista"
                stroke="var(--color-proyeccionPesimista)"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            )}
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
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
