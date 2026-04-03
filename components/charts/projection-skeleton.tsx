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

const chartConfig = {
  real: { label: "Historico", color: "#10b981" },
  proyeccion: { label: "Proyeccion", color: "#10b981" },
} satisfies ChartConfig;

const MOCK_DATA = [
  { month: "Ene", real: 500000, proyeccion: null },
  { month: "Feb", real: 520000, proyeccion: null },
  { month: "Mar", real: 540000, proyeccion: null },
  { month: "Abr", real: 560000, proyeccion: 560000 },
  { month: "May", real: null, proyeccion: 590000 },
  { month: "Jun", real: null, proyeccion: 625000 },
];

export function ProjectionSkeleton() {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return <div className="aspect-video animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <Card className="m-0 border-none shadow-none p-0">
      <CardHeader className="px-0">
        <CardTitle>Proyeccion Patrimonial (Demo)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Datos de ejemplo — se reemplazaran con datos reales
        </p>
      </CardHeader>
      <CardContent className="px-0">
        <ChartContainer config={chartConfig}>
          <ComposedChart data={MOCK_DATA}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="month"
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
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <ReferenceLine
              x="Abr"
              stroke="#888"
              strokeDasharray="3 3"
              label={{ value: "Hoy", position: "top", fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="real"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="proyeccion"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
