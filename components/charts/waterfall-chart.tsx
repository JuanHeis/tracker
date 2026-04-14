"use client";

import { useMemo } from "react";
import { useHydration } from "@/hooks/useHydration";
import { ChartContainer, ChartTooltip } from "../ui/chart";
import { BarChart, Bar, Cell, XAxis, YAxis, ReferenceLine, LabelList } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { ChartConfig } from "../ui/chart";
import type { WaterfallBar } from "@/lib/projection/waterfall";

const chartConfig = {
  flow: {
    label: "Flujo Mensual",
  },
} satisfies ChartConfig;

interface WaterfallChartProps {
  data: WaterfallBar[];
}

interface SimplifiedBar {
  name: string;
  amount: number;
  fill: string;
  breakdown: { name: string; amount: number }[];
}

const formatK = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 1000) return `$${(v / 1000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
};

const formatArs = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

function FlowTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SimplifiedBar }>;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium mb-1">{data.name}</p>
      <p className="text-sm font-mono mb-2">{formatArs(data.amount)}</p>
      {data.breakdown.length > 0 && (
        <div className="space-y-0.5 border-t pt-1">
          {data.breakdown.map((sub) => (
            <div key={sub.name} className="flex justify-between gap-4">
              <span className="text-muted-foreground">{sub.name}</span>
              <span className="font-mono">{formatArs(sub.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WaterfallChart({ data }: WaterfallChartProps) {
  const isHydrated = useHydration();

  const simplifiedData = useMemo((): SimplifiedBar[] => {
    if (data.length === 0) return [];

    const ingresos = data.find((b) => b.name === "Ingresos");
    const gastosFijos = data.find((b) => b.name === "Gastos Fijos");
    const gastosVariables = data.find((b) => b.name === "Gastos Variables");
    const inversiones = data.find((b) => b.name === "Inversiones");
    const ahorro = data.find((b) => b.name === "Ahorro");
    const libre = data.find((b) => b.name === "Libre");

    const egresosAmount =
      (gastosFijos?.amount ?? 0) +
      (gastosVariables?.amount ?? 0) +
      (inversiones?.amount ?? 0);
    const ahorroAmount = ahorro?.amount ?? 0;
    const libreAmount = libre?.amount ?? 0;

    const egresosBreakdown: { name: string; amount: number }[] = [];
    if (gastosFijos && gastosFijos.amount > 0)
      egresosBreakdown.push({ name: "Gastos Fijos", amount: gastosFijos.amount });
    if (gastosVariables && gastosVariables.amount > 0)
      egresosBreakdown.push({ name: "Gastos Variables", amount: gastosVariables.amount });
    if (inversiones && inversiones.amount > 0)
      egresosBreakdown.push({ name: "Inversiones", amount: inversiones.amount });

    const bars: SimplifiedBar[] = [
      {
        name: "Ingresos",
        amount: ingresos?.amount ?? 0,
        fill: "#22c55e",
        breakdown: ingresos?.subcategories ?? [],
      },
      {
        name: "Egresos",
        amount: egresosAmount,
        fill: "#f97316",
        breakdown: egresosBreakdown,
      },
    ];

    if (ahorroAmount > 0) {
      bars.push({
        name: "Ahorro",
        amount: ahorroAmount,
        fill: "#8b5cf6",
        breakdown: [],
      });
    }

    bars.push({
      name: "Libre",
      amount: libreAmount,
      fill: libreAmount >= 0 ? "#10b981" : "#ef4444",
      breakdown: [],
    });

    return bars;
  }, [data]);

  if (!isHydrated) {
    return <div className="aspect-video animate-pulse bg-muted rounded-lg" />;
  }

  if (data.length === 0 || data.every((bar) => bar.amount === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flujo Mensual</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <p className="text-muted-foreground text-sm">
            Sin datos para este mes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flujo Mensual</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ChartContainer config={chartConfig} className="aspect-video w-full">
          <BarChart
            data={simplifiedData}
            margin={{ top: 30, right: 10, bottom: 5, left: 10 }}
            barCategoryGap="20%"
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
            <ReferenceLine y={0} stroke="#888888" strokeDasharray="3 3" />
            <Bar
              dataKey="amount"
              radius={[4, 4, 0, 0]}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            >
              {simplifiedData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="amount"
                content={({ x, y, width, height, value }) => {
                  const numValue = value as number;
                  const isNeg = numValue < 0;
                  const labelY = isNeg
                    ? (y as number) + (height as number) + 16
                    : (y as number) - 8;
                  return (
                    <text
                      x={(x as number) + (width as number) / 2}
                      y={labelY}
                      textAnchor="middle"
                      className="fill-foreground text-xs font-medium"
                    >
                      {formatK(numValue)}
                    </text>
                  );
                }}
              />
            </Bar>
            <ChartTooltip
              content={<FlowTooltipContent />}
              cursor={false}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
