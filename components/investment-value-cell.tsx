"use client";

import { useState } from "react";
import NumberFlow from "@number-flow/react";
import { differenceInDays } from "date-fns";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { useHydration } from "@/hooks/useHydration";
import type { Investment } from "@/hooks/useMoneyTracker";
import { currencySymbol } from "@/constants/investments";

interface InvestmentValueCellProps {
  investment: Investment;
  onUpdateValue: (investmentId: string, newValue: number) => void;
}

export function calculatePFValue(investment: Investment): number {
  if (!investment.tna || !investment.plazoDias || !investment.startDate) {
    return investment.currentValue;
  }
  const totalInvested = investment.movements.reduce(
    (sum, m) => (m.type === "aporte" ? sum + m.amount : sum - m.amount),
    0
  );
  const elapsedDays = differenceInDays(
    new Date(),
    new Date(investment.startDate)
  );
  const daysToUse = Math.min(elapsedDays, investment.plazoDias);
  return totalInvested * (1 + ((investment.tna / 100) / 365) * daysToUse);
}

export function calculateGainLoss(investment: Investment) {
  const totalInvested = investment.movements.reduce(
    (sum, m) => (m.type === "aporte" ? sum + m.amount : sum - m.amount),
    0
  );
  const currentVal =
    investment.type === "Plazo Fijo"
      ? calculatePFValue(investment)
      : investment.currentValue;
  const gainLoss = currentVal - totalInvested;
  const percentage = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
  return { totalInvested, currentVal, gainLoss, percentage };
}

export function isValueOutdated(investment: Investment): boolean {
  if (investment.type === "Plazo Fijo") return false;
  if (investment.status === "Finalizada") return false;
  return differenceInDays(new Date(), new Date(investment.lastUpdated)) > 7;
}

export function InvestmentValueCell({
  investment,
  onUpdateValue,
}: InvestmentValueCellProps) {
  const isHydrated = useHydration();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(investment.currentValue);

  const isPF = investment.type === "Plazo Fijo";
  const { gainLoss, percentage } = calculateGainLoss(investment);
  const displayValue = isPF
    ? calculatePFValue(investment)
    : investment.currentValue;

  const handleSave = () => {
    const parsed = Number(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateValue(investment.id, parsed);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setValue(investment.currentValue);
      setEditing(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {editing ? (
          <Input
            type="number"
            autoFocus
            className="w-28 h-7 text-sm"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
          />
        ) : isPF ? (
          <span className="tabular-nums">
            {isHydrated ? (
              <>{currencySymbol(investment.currencyType)}<NumberFlow value={displayValue} format={{ style: "decimal", minimumFractionDigits: 0, maximumFractionDigits: 2 }} /></>
            ) : (
              `${currencySymbol(investment.currencyType)}${displayValue.toLocaleString()}`
            )}
          </span>
        ) : (
          <span
            onClick={() => {
              setValue(investment.currentValue);
              setEditing(true);
            }}
            className="cursor-pointer hover:underline tabular-nums"
          >
            {isHydrated ? (
              <>{currencySymbol(investment.currencyType)}<NumberFlow value={displayValue} format={{ style: "decimal", minimumFractionDigits: 0, maximumFractionDigits: 2 }} /></>
            ) : (
              `${currencySymbol(investment.currencyType)}${displayValue.toLocaleString()}`
            )}
          </span>
        )}
        {isValueOutdated(investment) && (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-[10px] px-1.5 py-0">
            Desactualizado
          </Badge>
        )}
      </div>
      <div
        className={`text-xs tabular-nums ${
          gainLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        {isHydrated ? (
          <>
            {gainLoss >= 0 ? "+" : ""}{currencySymbol(investment.currencyType)}
            <NumberFlow value={Math.abs(gainLoss)} format={{ style: "decimal", minimumFractionDigits: 0, maximumFractionDigits: 2 }} />
            {" ("}
            {gainLoss >= 0 ? "+" : ""}
            <NumberFlow value={percentage} format={{ style: "decimal", minimumFractionDigits: 1, maximumFractionDigits: 1 }} />
            {"%)"}
          </>
        ) : (
          <span>
            {gainLoss >= 0 ? "+" : ""}{currencySymbol(investment.currencyType)}
            {Math.abs(gainLoss).toLocaleString()} ({gainLoss >= 0 ? "+" : ""}
            {percentage.toFixed(1)}%)
          </span>
        )}
      </div>
    </div>
  );
}
