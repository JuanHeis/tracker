"use client";

import { Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UsdPurchase } from "@/hooks/useMoneyTracker";
import { cn } from "@/lib/utils";

interface ExchangeSummaryProps {
  usdPurchases: UsdPurchase[];
  globalUsdRate: number;
  exchangeGainLoss: {
    totalGainLoss: number;
    perPurchase: Array<{ id: string; gainLoss: number }>;
  };
  onDelete: (purchaseId: string) => void;
}

export function ExchangeSummary({
  usdPurchases,
  globalUsdRate,
  exchangeGainLoss,
  onDelete,
}: ExchangeSummaryProps) {
  const totalUsd = usdPurchases.reduce((sum, p) => sum + p.usdAmount, 0);

  const getGainLossForPurchase = (id: string): number | null => {
    const entry = exchangeGainLoss.perPurchase.find((p) => p.id === id);
    return entry ? entry.gainLoss : null;
  };

  const formatArs = (value: number) =>
    `$${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatUsd = (value: number) =>
    `US$${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Dolares</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total USD comprados:</span>
            <span className="font-medium">{formatUsd(totalUsd)}</span>
          </div>
          {globalUsdRate > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ganancia/Perdida cambiaria:</span>
              <span
                className={cn(
                  "font-medium",
                  exchangeGainLoss.totalGainLoss > 0 && "text-green-600",
                  exchangeGainLoss.totalGainLoss < 0 && "text-red-600"
                )}
              >
                {formatArs(exchangeGainLoss.totalGainLoss)}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Configure cotizacion USD para ver ganancia cambiaria
            </p>
          )}
        </div>

        {usdPurchases.length === 0 ? (
          <p className="text-sm text-muted-foreground pt-2">
            No hay operaciones en USD
          </p>
        ) : (
          <div className="space-y-2 pt-2">
            {usdPurchases.map((purchase) => {
              const gainLoss = getGainLossForPurchase(purchase.id);
              return (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between gap-2 text-xs border-b pb-2 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{purchase.date}</span>
                      <span className="font-medium">{formatUsd(purchase.usdAmount)}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {purchase.origin === "tracked" ? "Compra" : "No trackeado"}
                      </Badge>
                    </div>
                    {purchase.origin === "tracked" ? (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-muted-foreground">
                          @${purchase.purchaseRate.toFixed(2)}
                        </span>
                        {gainLoss !== null && globalUsdRate > 0 && (
                          <span
                            className={cn(
                              gainLoss > 0 && "text-green-600",
                              gainLoss < 0 && "text-red-600"
                            )}
                          >
                            {formatArs(gainLoss)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground mt-0.5 block truncate">
                        {purchase.description}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => onDelete(purchase.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
