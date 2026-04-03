import { useHydration } from "@/hooks/useHydration";
import { CardContent } from "./ui/card";

interface TotalAmountsProps {
  arsBalancePeriod?: number;
  arsBalanceAccumulated?: number;
  usdBalancePeriod?: number;
  usdBalanceAccumulated?: number;
  arsBalance?: number;
  usdBalance?: number;
  arsInvestments: number;
  usdInvestments: number;
  globalUsdRate: number;
  balanceViewMode?: "periodo" | "acumulado";
}

export function TotalAmounts({
  arsBalancePeriod,
  arsBalanceAccumulated,
  usdBalancePeriod,
  usdBalanceAccumulated,
  arsBalance: arsBalanceLegacy,
  usdBalance: usdBalanceLegacy,
  arsInvestments,
  usdInvestments,
  globalUsdRate,
  balanceViewMode = "periodo",
}: TotalAmountsProps) {
  const isHydrated = useHydration();

  // Support both new dual-mode and legacy single-value props
  const arsBalance = balanceViewMode === "periodo"
    ? (arsBalancePeriod ?? arsBalanceLegacy ?? 0)
    : (arsBalanceAccumulated ?? arsBalanceLegacy ?? 0);
  const usdBalance = balanceViewMode === "periodo"
    ? (usdBalancePeriod ?? usdBalanceLegacy ?? 0)
    : (usdBalanceAccumulated ?? usdBalanceLegacy ?? 0);

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
    <CardContent>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Liquido ARS:</span>
          <span className="font-medium">{formatArs(arsBalance)}</span>
        </div>
        <div className="flex justify-between">
          <span>Liquido USD:</span>
          <span className="font-medium text-green-600 dark:text-green-400">
            {formatUsd(usdBalance)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Inversiones ARS:</span>
          <span className="font-medium">{formatArs(arsInvestments)}</span>
        </div>
        <div className="flex justify-between">
          <span>Inversiones USD:</span>
          <span className="font-medium text-green-600 dark:text-green-400">
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
  );
}
