"use client";

import type { WaterfallBar } from "@/lib/projection/waterfall";

const formatArs = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

interface WaterfallTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: WaterfallBar }>;
}

export function WaterfallTooltipContent({
  active,
  payload,
}: WaterfallTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium mb-1">{data.name}</p>
      <p className="text-sm font-mono mb-2">{formatArs(data.amount)}</p>
      {data.subcategories.length > 0 && (
        <div className="space-y-0.5 border-t pt-1">
          {data.subcategories.map((sub) => (
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
