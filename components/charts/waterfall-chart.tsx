"use client";

import { useHydration } from "@/hooks/useHydration";
import { ChartContainer, ChartTooltip } from "../ui/chart";
import { BarChart, Bar, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { ChartConfig } from "../ui/chart";
import type { WaterfallBar } from "@/lib/projection/waterfall";
import { WaterfallTooltipContent } from "./waterfall-tooltip";

const chartConfig = {
  waterfall: {
    label: "Flujo Mensual",
  },
} satisfies ChartConfig;

interface WaterfallChartProps {
  data: WaterfallBar[];
}

export function WaterfallChart({ data }: WaterfallChartProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return <div className="aspect-video animate-pulse bg-muted rounded-lg" />;
  }

  if (data.length === 0 || data.every((bar) => bar.amount === 0)) {
    return (
      <Card className="m-0 border-none shadow-none p-0">
        <CardHeader className="px-0">
          <CardTitle>Flujo Mensual</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <p className="text-muted-foreground text-sm">
            Sin datos para este mes
          </p>
        </CardContent>
      </Card>
    );
  }

  const waterfallRange = (d: WaterfallBar): [number, number] => [
    d.barBottom,
    d.barTop,
  ];

  return (
    <Card className="m-0 border-none shadow-none p-0">
      <CardHeader className="px-0">
        <CardTitle>Flujo Mensual</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ChartContainer config={chartConfig}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 5, left: 20 }}
          >
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Bar
              dataKey={waterfallRange}
              radius={[4, 4, 0, 0]}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
            <ChartTooltip
              content={<WaterfallTooltipContent />}
              cursor={false}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
