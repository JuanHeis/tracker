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
import type { SimulatorDataPoint } from "@/lib/projection/simulator";

const chartConfig = {
  sinSimulacion: {
    label: "Sin gastos simulados",
    color: "hsl(var(--chart-1))",
  },
  conSimulacion: {
    label: "Con gastos simulados",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

interface SimulatorChartProps {
  data: SimulatorDataPoint[];
}

export function SimulatorChart({ data }: SimulatorChartProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return <div className="aspect-video animate-pulse bg-muted rounded-lg" />;
  }

  const xAxisInterval =
    data.length <= 8 ? 0 : data.length <= 14 ? 1 : 2;

  const hasNegative = data.some((d) => d.conSimulacion < 0);

  return (
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
          x={data[0]?.month}
          stroke="#888"
          strokeDasharray="3 3"
          label={{ value: "Hoy", position: "top", fontSize: 12 }}
        />
        {hasNegative && (
          <ReferenceLine
            y={0}
            stroke="red"
            strokeDasharray="2 2"
          />
        )}
        <Line
          type="monotone"
          dataKey="sinSimulacion"
          stroke="var(--color-sinSimulacion)"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="conSimulacion"
          stroke="var(--color-conSimulacion)"
          strokeDasharray="5 5"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
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
  );
}
