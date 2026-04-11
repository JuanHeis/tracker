"use client";

import { useHydration } from "@/hooks/useHydration";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import type { ChartConfig } from "../ui/chart";
import { ComposedChart, Line, XAxis, YAxis } from "recharts";
import type { ProjectionSummary } from "@/lib/projection/types";

const formatArs = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

const chartConfig = {
  optimista: {
    label: "Optimista",
    color: "hsl(var(--chart-2))",
  },
  base: {
    label: "Base",
    color: "hsl(var(--chart-1))",
  },
  pesimista: {
    label: "Pesimista",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

interface MiniProjectionChartProps {
  data: {
    month: string;
    optimista: number;
    base: number;
    pesimista: number;
  }[];
  projectedPatrimony: ProjectionSummary;
}

export function MiniProjectionChart({
  data,
  projectedPatrimony,
}: MiniProjectionChartProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return (
      <div className="h-[150px] animate-pulse bg-muted rounded-lg" />
    );
  }

  return (
    <div>
      <p className="text-sm font-medium mb-2">
        Patrimonio estimado (12 meses)
      </p>
      <ChartContainer config={chartConfig} className="h-[150px] w-full">
        <ComposedChart
          data={data}
          margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
        >
          <XAxis dataKey="month" hide={true} />
          <YAxis hide={true} />
          <Line
            type="monotone"
            dataKey="optimista"
            stroke="var(--color-optimista)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="base"
            stroke="var(--color-base)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="pesimista"
            stroke="var(--color-pesimista)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  `$${(Number(value) / 1000).toFixed(0)}k`
                }
              />
            }
            cursor={false}
          />
        </ComposedChart>
      </ChartContainer>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Pesimista: {formatArs(projectedPatrimony.pesimista)}</span>
        <span className="font-medium text-foreground">
          Base: {formatArs(projectedPatrimony.base)}
        </span>
        <span>Optimista: {formatArs(projectedPatrimony.optimista)}</span>
      </div>
    </div>
  );
}
