import { useHydration } from "@/hooks/useHydration";
import { CardContent } from "./ui/card";

interface TotalAmountsProps {
  availableForUse: number;
  blockedInInvestments: number;
  total: number;
}

export function TotalAmounts({
  availableForUse,
  blockedInInvestments,
  total,
}: TotalAmountsProps) {
  const isHydrated = useHydration();

  const formatAmount = (amount: number) => {
    if (!isHydrated) return "---";
    return amount.toLocaleString();
  };

  return (
    <CardContent>
      <div className="space-y-4">
        <div className="flex justify-between">
          <span>Total Disponible:</span>
          <span className="font-medium">
            ARS ${formatAmount(availableForUse)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Inversiones:</span>
          <span className="font-medium">
            ARS ${formatAmount(blockedInInvestments)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-medium">ARS ${formatAmount(total)}</span>
        </div>
      </div>
    </CardContent>
  );
}
