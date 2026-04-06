"use client";

import { useState } from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/currency-input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormattedAmount } from "./formatted-amount";
import { cn } from "@/lib/utils";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
} from "@/components/ui/tooltip";

interface ResumenCardProps {
  ingresoFijo: number;
  ingresoFijoIsOverride: boolean;
  otrosIngresos: number;
  aguinaldoAmount: number | null;
  aguinaldoInfo: { bestSalary: number; isOverride: boolean } | null;
  totalGastos: number;
  aportesInversiones: number;
  porPagarArs: number;
  porPagarUsd: number;
  disponible: number;
  isPendiente: boolean;
  payDay: number;
  aguinaldoPreview: { estimatedAmount: number; bestSalary: number; targetMonth: string } | null;
  onSetAguinaldoOverride: (monthKey: string, amount: number) => void;
  onClearAguinaldoOverride: (monthKey: string) => void;
  selectedMonth: string;
}

export function ResumenCard({
  ingresoFijo,
  ingresoFijoIsOverride,
  otrosIngresos,
  aguinaldoAmount,
  aguinaldoInfo,
  totalGastos,
  aportesInversiones,
  porPagarArs,
  porPagarUsd,
  disponible,
  isPendiente,
  payDay,
  aguinaldoPreview,
  onSetAguinaldoOverride,
  onClearAguinaldoOverride,
  selectedMonth,
}: ResumenCardProps) {
  const [editingAguinaldo, setEditingAguinaldo] = useState(false);
  const [aguinaldoInput, setAguinaldoInput] = useState("");

  const handleStartEditAguinaldo = () => {
    setAguinaldoInput(aguinaldoAmount != null ? String(aguinaldoAmount) : "");
    setEditingAguinaldo(true);
  };

  const handleSubmitAguinaldo = () => {
    const val = parseFloat(aguinaldoInput);
    if (!isNaN(val) && val >= 0) {
      onSetAguinaldoOverride(selectedMonth, val);
    }
    setEditingAguinaldo(false);
  };

  // Format target month name for preview banner
  const formatMonthName = (monthKey: string): string => {
    try {
      const parsed = parse(monthKey, "yyyy-MM", new Date());
      return format(parsed, "MMMM", { locale: es });
    } catch {
      return monthKey;
    }
  };

  return (
    <Card className="h-fit">
      <TooltipProvider>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Resumen del Mes</CardTitle>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Este mes
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Pendiente de cobro banner */}
            {isPendiente && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200">
                Pendiente de cobro — Cobras el dia {payDay}
              </div>
            )}

            {/* Aguinaldo preview banner */}
            {aguinaldoPreview && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-200">
                Aguinaldo estimado en {formatMonthName(aguinaldoPreview.targetMonth)}:{" "}
                <span className="font-medium">
                  <FormattedAmount value={aguinaldoPreview.estimatedAmount} currency="$" />
                </span>
                {" "}(50% de <FormattedAmount value={aguinaldoPreview.bestSalary} currency="$" />)
              </div>
            )}

            {/* INGRESOS section */}
            <p className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Ingresos</p>

            {/* Ingreso fijo */}
            <div className="flex justify-between">
              <span>Ingreso fijo:</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn("font-medium text-green-600 dark:text-green-400 cursor-help", isPendiente && "opacity-50")}>
                    <FormattedAmount value={ingresoFijo} currency="ARS" />
                    {ingresoFijoIsOverride && (
                      <span className="ml-1 text-xs text-muted-foreground">(ajuste)</span>
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Ingreso fijo mensual{ingresoFijoIsOverride ? " (ajuste manual)" : " (desde historial)"}</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Otros ingresos */}
            {otrosIngresos > 0 && (
              <div className="flex justify-between">
                <span>Otros ingresos:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-green-600 dark:text-green-400 cursor-help">
                      <FormattedAmount value={otrosIngresos} currency="ARS" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Suma de otros ingresos en ARS del periodo</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Aguinaldo */}
            {aguinaldoAmount != null && aguinaldoInfo && (
              <div className="flex items-center justify-between">
                <span>
                  Aguinaldo {aguinaldoInfo.isOverride ? "(ajuste)" : "(auto)"}:
                </span>
                {editingAguinaldo ? (
                  <div className="flex items-center gap-1">
                    <CurrencyInput
                      value={parseFloat(aguinaldoInput) || ""}
                      onValueChange={(n) => setAguinaldoInput(String(n))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSubmitAguinaldo();
                        }
                        if (e.key === "Escape") setEditingAguinaldo(false);
                      }}
                      className="h-7 w-24 text-sm"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSubmitAguinaldo}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingAguinaldo(false)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium text-green-600 dark:text-green-400 cursor-help">
                          <FormattedAmount value={aguinaldoAmount} currency="$" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>50% del mejor ingreso fijo del semestre (<FormattedAmount value={aguinaldoInfo.bestSalary} currency="$" />)</p>
                      </TooltipContent>
                    </Tooltip>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-blue-500"
                      onClick={handleStartEditAguinaldo}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {aguinaldoInfo.isOverride && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground hover:text-blue-500 px-1"
                        onClick={() => onClearAguinaldoOverride(selectedMonth)}
                      >
                        reset
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* EGRESOS section */}
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Egresos</p>

            {/* Gastos */}
            <div className="flex justify-between">
              <span>Gastos:</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-medium text-red-500 cursor-help">
                    <FormattedAmount value={totalGastos} currency="ARS" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Total gastos en ARS del periodo</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Aportes inversiones */}
            {aportesInversiones > 0 && (
              <div className="flex justify-between">
                <span>Aportes inversiones:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-blue-500 dark:text-blue-400 cursor-help">
                      <FormattedAmount value={-aportesInversiones} currency="ARS" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Aportes a inversiones en ARS del periodo</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {porPagarArs > 0 && (
              <div className="flex justify-between">
                <span>Por pagar ARS:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-amber-500 dark:text-amber-400 cursor-help">
                      <FormattedAmount value={-porPagarArs} currency="ARS" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Gastos en ARS aun no pagados este mes</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {porPagarUsd > 0 && (
              <div className="flex justify-between">
                <span>Por pagar USD:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-amber-500 dark:text-amber-400 cursor-help">
                      <FormattedAmount value={-porPagarUsd} currency="USD" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Gastos en USD aun no pagados este mes</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            <hr className="border-border" />

            {/* Disponible */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-between w-full cursor-help">
                  <span className="font-bold">Disponible:</span>
                  <span className={cn("font-bold", disponible >= 0 ? "text-green-500" : "text-red-500")}>
                    <FormattedAmount value={disponible} currency="ARS" />
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="font-bold mb-1">Disponible = Ingresos - Egresos</p>
                <p>Ingreso fijo: <FormattedAmount value={ingresoFijo} currency="$" /></p>
                <p>+ Otros ingresos: <FormattedAmount value={otrosIngresos} currency="$" /></p>
                {aguinaldoAmount != null && (
                  <p>+ Aguinaldo: <FormattedAmount value={aguinaldoAmount} currency="$" /></p>
                )}
                <p className="text-red-400">- Gastos: <FormattedAmount value={totalGastos} currency="$" /></p>
                {aportesInversiones > 0 && (
                  <p className="text-blue-400">- Aportes inv.: <FormattedAmount value={aportesInversiones} currency="$" /></p>
                )}
                {porPagarArs > 0 && (
                  <p className="text-amber-400">- Por pagar ARS: <FormattedAmount value={porPagarArs} currency="$" /></p>
                )}
                {porPagarUsd > 0 && (
                  <p className="text-amber-400">- Por pagar USD: <FormattedAmount value={porPagarUsd} currency="USD" /></p>
                )}
                <hr className="my-1 border-border" />
                <p className="font-bold">= <FormattedAmount value={disponible} currency="$" /></p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </TooltipProvider>
    </Card>
  );
}
