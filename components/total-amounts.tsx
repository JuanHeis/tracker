import { useHydration } from "@/hooks/useHydration";
import { CardContent } from "./ui/card";

interface TotalAmountsProps {
  arsBalance: number;
  usdBalance: number;
  arsInvestments: number;
  usdInvestments: number;
  globalUsdRate: number;
}

export function TotalAmounts({
  arsBalance,
  usdBalance,
  arsInvestments,
  usdInvestments,
  globalUsdRate,
}: TotalAmountsProps) {
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
