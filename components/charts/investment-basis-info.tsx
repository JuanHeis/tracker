import { Info } from "lucide-react";
import { CurrencyInput } from "@/components/currency-input";
import type { InvestmentProjection } from "@/lib/projection/types";
import type { Investment } from "@/hooks/useMoneyTracker";

interface InvestmentBasisInfoProps {
  projections: InvestmentProjection[];
  investments: Investment[];
  includeContributions: boolean;
  contributionOverrides: Record<string, number>;
  onContributionOverrideChange: (investmentId: string, value: number) => void;
}

function formatCurrency(value: number, currencyType: string): string {
  const symbol = currencyType === "USD" ? "USD" : "ARS";
  return `${symbol} $${value.toLocaleString("es-AR")}`;
}

function getUpdateStatus(
  projection: InvestmentProjection,
  investments: Investment[]
): { label: string; isWarning: boolean } {
  const inv = investments.find((i) => i.id === projection.investmentId);
  if (!inv) {
    return { label: "Sin datos", isWarning: true };
  }

  const hasNonInitialMovements = inv.movements.some((m) => !m.isInitial);
  if (!hasNonInitialMovements && inv.lastUpdated === inv.createdAt) {
    return { label: "Valor original - nunca actualizado", isWarning: true };
  }

  const formatted = new Date(inv.lastUpdated + "T00:00:00").toLocaleDateString(
    "es-AR",
    { day: "2-digit", month: "short", year: "2-digit" }
  );
  return { label: `Actualizado: ${formatted}`, isWarning: false };
}

export function InvestmentBasisInfo({
  projections,
  investments,
  includeContributions,
  contributionOverrides,
  onContributionOverrideChange,
}: InvestmentBasisInfoProps) {
  if (projections.length === 0) {
    return null;
  }

  return (
    <div className="text-xs text-muted-foreground mt-4">
      <div className="flex items-center gap-1 font-medium mb-1">
        <Info className="h-3 w-3" />
        <span>Bases de proyeccion:</span>
      </div>
      <div className="space-y-0.5">
        {projections.map((p) => {
          const ratePercent = (p.annualRate * 100).toFixed(0);
          let rateLabel: string;
          if (p.rateSource === "tna") {
            rateLabel = `TNA ${ratePercent}%`;
          } else if (p.rateSource === "observed") {
            rateLabel = `${ratePercent}% anual (tasa real observada)`;
          } else if (p.rateSource === "custom") {
            rateLabel = `${ratePercent}% anual (configurada)`;
          } else {
            rateLabel = `${ratePercent}% anual (por defecto)`;
          }
          const status = getUpdateStatus(p, investments);

          const currencySymbol = p.currencyType === "USD" ? "USD" : "$";
          const displayContribution =
            contributionOverrides[p.investmentId] !== undefined
              ? contributionOverrides[p.investmentId]
              : p.monthlyContribution;

          return (
            <div
              key={p.investmentId}
              className="flex flex-wrap items-center gap-x-4 gap-y-0.5"
            >
              <span className="font-medium">{p.investmentName}</span>
              <span>{formatCurrency(p.currentValue, p.currencyType)}</span>
              <span>{rateLabel}</span>
              {includeContributions && (
                <span className="flex items-center gap-1">
                  <span className="text-muted-foreground">Aporte mensual:</span>
                  <span className="text-muted-foreground">{currencySymbol}</span>
                  <CurrencyInput
                    value={displayContribution}
                    onValueChange={(val) => {
                      onContributionOverrideChange(p.investmentId, val);
                    }}
                    className="h-6 w-24 text-xs px-1 inline"
                  />
                </span>
              )}
              <span
                className={
                  status.isWarning
                    ? "text-amber-600 dark:text-amber-400"
                    : ""
                }
              >
                {status.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
