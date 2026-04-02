"use client";

import { useHydration } from "@/hooks/useHydration";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PatrimonioCardProps {
  arsBalance: number;
  usdBalance: number;
  arsInvestments: number;
  usdInvestments: number;
  globalUsdRate: number;
}

export function PatrimonioCard({
  arsBalance,
  usdBalance,
  arsInvestments,
  usdInvestments,
  globalUsdRate,
}: PatrimonioCardProps) {
  const isHydrated = useHydration();

  const formatArs = (amount: number) => {
    if (!isHydrated) return "---";
    return `$ ${amount.toLocaleString()}`;
  };

  const formatUsd = (amount: number) => {
    if (!isHydrated) return "---";
    return `US$ ${amount.toLocaleString()}`;
  };

  const patrimonio =
    globalUsdRate > 0
      ? arsBalance +
        usdBalance * globalUsdRate +
        arsInvestments +
        usdInvestments * globalUsdRate
      : 0;

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Patrimonio Total</CardTitle>
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          Historico
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Liquido ARS:</span>
            <span className="font-medium">{formatArs(arsBalance)}</span>
          </div>
          <div className="flex justify-between">
            <span>Liquido USD:</span>
            <span className="font-medium">{formatUsd(usdBalance)}</span>
          </div>
          <div className="flex justify-between">
            <span>Inversiones ARS:</span>
            <span className="font-medium text-blue-500 dark:text-blue-400">
              {formatArs(arsInvestments)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Inversiones USD:</span>
            <span className="font-medium text-blue-500 dark:text-blue-400">
              {formatUsd(usdInvestments)}
            </span>
          </div>
          <hr className="border-border" />
          {globalUsdRate > 0 ? (
            <div className="flex justify-between">
              <span className="font-semibold">Patrimonio Total:</span>
              <span className="font-bold">{formatArs(patrimonio)}</span>
            </div>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Configure cotizacion USD para ver patrimonio total
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
