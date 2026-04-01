"use client";

import { useState } from "react";
import { format, addDays, isAfter } from "date-fns";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { TableRow, TableCell } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { InvestmentValueCell } from "./investment-value-cell";
import { InvestmentMovements } from "./investment-movements";
import { useHydration } from "@/hooks/useHydration";
import { DATE_FORMAT } from "@/constants/date";
import type { Investment } from "@/hooks/useMoneyTracker";
import { currencySymbol } from "@/constants/investments";

interface InvestmentRowProps {
  investment: Investment;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddMovement: (
    investmentId: string,
    movement: { date: string; type: "aporte" | "retiro"; amount: number }
  ) => void;
  onDeleteMovement: (investmentId: string, movementId: string) => void;
  onUpdateValue: (investmentId: string, newValue: number) => void;
  onUpdatePFFields: (
    investmentId: string,
    fields: { tna?: number; plazoDias?: number; startDate?: string }
  ) => void;
  onFinalize: (investmentId: string) => void;
  onDelete: (investmentId: string) => void;
  onEdit: (investment: Investment) => void;
}

function isPFExpired(investment: Investment): boolean {
  if (investment.type !== "Plazo Fijo") return false;
  if (!investment.startDate || !investment.plazoDias) return false;
  const endDate = addDays(new Date(investment.startDate), investment.plazoDias);
  return isAfter(new Date(), endDate);
}

export function InvestmentRow({
  investment,
  isExpanded,
  onToggleExpand,
  onAddMovement,
  onDeleteMovement,
  onUpdateValue,
  onUpdatePFFields,
  onFinalize,
  onDelete,
  onEdit,
}: InvestmentRowProps) {
  const isHydrated = useHydration();
  const isPF = investment.type === "Plazo Fijo";
  const isFinalized = investment.status === "Finalizada";

  const capitalInvested = investment.movements.reduce(
    (sum, m) => (m.type === "aporte" ? sum + m.amount : sum - m.amount),
    0
  );

  return (
    <>
      <TableRow
        className={`cursor-pointer ${isFinalized ? "opacity-60" : ""}`}
        onClick={onToggleExpand}
      >
        <TableCell className="w-8">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="font-medium">{investment.name}</span>
            {isFinalized && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Finalizada
              </Badge>
            )}
            {isPFExpired(investment) && !isFinalized && (
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-[10px] px-1.5 py-0">
                Vencido
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>{investment.type}</TableCell>
        <TableCell className="tabular-nums">
          {isHydrated ? `${currencySymbol(investment.currencyType)}${capitalInvested.toLocaleString()}` : "---"}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <InvestmentValueCell
            investment={investment}
            onUpdateValue={onUpdateValue}
          />
        </TableCell>
        <TableCell className="tabular-nums">
          {isHydrated
            ? (() => {
                const ganancia = investment.currentValue - capitalInvested;
                const pct = capitalInvested !== 0 ? (ganancia / capitalInvested) * 100 : 0;
                const color = ganancia >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
                return (
                  <span className={color}>
                    {ganancia >= 0 ? "+" : ""}{currencySymbol(investment.currencyType)}{ganancia.toLocaleString()} ({pct.toFixed(1)}%)
                  </span>
                );
              })()
            : "---"}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {isPF
            ? "Auto"
            : isHydrated
            ? format(new Date(investment.lastUpdated), DATE_FORMAT)
            : "---"}
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 cursor-pointer text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900"
              onClick={() => onEdit(investment)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {!isFinalized && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs cursor-pointer text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900"
                onClick={() => onFinalize(investment.id)}
              >
                Finalizar
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 cursor-pointer text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
              onClick={() => onDelete(investment.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/30 p-4">
            <div className="space-y-4">
              {isPF && <PFFieldsEditor investment={investment} onUpdatePFFields={onUpdatePFFields} />}
              <InvestmentMovements
                investment={investment}
                onAddMovement={onAddMovement}
                onDeleteMovement={onDeleteMovement}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// Inline PF fields editor (TNA, Plazo, Start Date)
function PFFieldsEditor({
  investment,
  onUpdatePFFields,
}: {
  investment: Investment;
  onUpdatePFFields: (
    investmentId: string,
    fields: { tna?: number; plazoDias?: number; startDate?: string }
  ) => void;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tnaValue, setTnaValue] = useState(investment.tna ?? 0);
  const [plazoValue, setPlazoValue] = useState(investment.plazoDias ?? 0);
  const [startDateValue, setStartDateValue] = useState(
    investment.startDate ?? ""
  );

  const saveTNA = () => {
    onUpdatePFFields(investment.id, { tna: tnaValue });
    setEditingField(null);
  };

  const savePlazo = () => {
    onUpdatePFFields(investment.id, { plazoDias: plazoValue });
    setEditingField(null);
  };

  const saveStartDate = () => {
    onUpdatePFFields(investment.id, { startDate: startDateValue });
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, saveFn: () => void) => {
    if (e.key === "Enter") saveFn();
    else if (e.key === "Escape") setEditingField(null);
  };

  return (
    <div className="flex gap-6 pb-3 border-b text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">TNA:</span>
        {editingField === "tna" ? (
          <Input
            type="number"
            autoFocus
            className="h-7 w-20 text-sm"
            value={tnaValue}
            onChange={(e) => setTnaValue(Number(e.target.value))}
            onKeyDown={(e) => handleKeyDown(e, saveTNA)}
            onBlur={saveTNA}
            step="0.1"
          />
        ) : (
          <span
            onClick={() => {
              setTnaValue(investment.tna ?? 0);
              setEditingField("tna");
            }}
            className="cursor-pointer hover:underline font-medium"
          >
            {investment.tna ?? 0}%
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Plazo:</span>
        {editingField === "plazo" ? (
          <Input
            type="number"
            autoFocus
            className="h-7 w-20 text-sm"
            value={plazoValue}
            onChange={(e) => setPlazoValue(Number(e.target.value))}
            onKeyDown={(e) => handleKeyDown(e, savePlazo)}
            onBlur={savePlazo}
          />
        ) : (
          <span
            onClick={() => {
              setPlazoValue(investment.plazoDias ?? 0);
              setEditingField("plazo");
            }}
            className="cursor-pointer hover:underline font-medium"
          >
            {investment.plazoDias ?? 0} dias
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Inicio:</span>
        {editingField === "startDate" ? (
          <Input
            type="date"
            autoFocus
            className="h-7 w-36 text-sm"
            value={startDateValue}
            onChange={(e) => setStartDateValue(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, saveStartDate)}
            onBlur={saveStartDate}
          />
        ) : (
          <span
            onClick={() => {
              setStartDateValue(investment.startDate ?? "");
              setEditingField("startDate");
            }}
            className="cursor-pointer hover:underline font-medium"
          >
            {investment.startDate || "Sin fecha"}
          </span>
        )}
      </div>
    </div>
  );
}
