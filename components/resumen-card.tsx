"use client";

import { useState } from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Check, X, AlertTriangle, DollarSign } from "lucide-react";
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
import { type DeficitState } from "@/lib/resumen/deficit-detector";

interface ResumenCardProps {
  // Currency display state (orchestrator-controlled)
  currency: "ARS" | "USD";
  onCurrencyToggle: () => void;

  // ARS metric block (always provided)
  ingresoFijo: number;
  ingresoFijoIsOverride: boolean;
  otrosIngresos: number;
  sobranteRaw: number;              // SIGNED — can be negative
  aguinaldoAmount: number | null;
  aguinaldoInfo: { bestSalary: number; isOverride: boolean } | null;
  totalGastos: number;
  aportesNoNeutros: number;         // counts as egreso
  aportesAll: number;               // for tooltip
  cashEffect: number;               // SIGNED net cash effect folded into disponible (aportes+USD+loans)
  porPagarArs: number;
  porPagarUsd: number;
  disponible: number;
  resultadoDelMes: number;          // SIGNED, always rendered

  // USD parallel block (optional — required only when user can toggle)
  usdMetrics?: {
    otrosIngresos: number;
    sobranteRaw: number;
    totalGastos: number;
    aportesNoNeutros: number;
    aportesAll: number;
    cashEffect: number;
    disponible: number;
    resultadoDelMes: number;
  };

  // Deficit banners
  deficitState: DeficitState;
  deficitRecurrenteDismissed: boolean;
  onDismissDeficitRecurrente: () => void;

  // Pre-existing
  isPendiente: boolean;
  payDay: number;
  aguinaldoPreview: { estimatedAmount: number; bestSalary: number; targetMonth: string } | null;
  onSetAguinaldoOverride: (monthKey: string, amount: number) => void;
  onClearAguinaldoOverride: (monthKey: string) => void;
  selectedMonth: string;
}

export function ResumenCard({
  currency,
  onCurrencyToggle,
  ingresoFijo,
  ingresoFijoIsOverride,
  otrosIngresos,
  sobranteRaw,
  aguinaldoAmount,
  aguinaldoInfo,
  totalGastos,
  aportesNoNeutros,
  aportesAll,
  cashEffect,
  porPagarArs,
  porPagarUsd,
  disponible,
  resultadoDelMes,
  usdMetrics,
  deficitState,
  deficitRecurrenteDismissed,
  onDismissDeficitRecurrente,
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

  // Compute the active display block based on selected currency
  const isUsd = currency === "USD";
  const active = isUsd && usdMetrics
    ? {
        ingresoFijo: 0,                                // USD has no salary
        otrosIngresos: usdMetrics.otrosIngresos,
        sobranteRaw: usdMetrics.sobranteRaw,
        aguinaldo: 0,                                  // USD has no aguinaldo
        totalGastos: usdMetrics.totalGastos,
        aportesNoNeutros: usdMetrics.aportesNoNeutros,
        aportesAll: usdMetrics.aportesAll,
        cashEffect: usdMetrics.cashEffect,
        disponible: usdMetrics.disponible,
        resultadoDelMes: usdMetrics.resultadoDelMes,
      }
    : {
        ingresoFijo,
        otrosIngresos,
        sobranteRaw,
        aguinaldo: aguinaldoAmount ?? 0,
        totalGastos,
        aportesNoNeutros,
        aportesAll,
        cashEffect,
        disponible,
        resultadoDelMes,
      };
  const displaySobrantePositive = Math.max(0, active.sobranteRaw);
  const showAguinaldoLine = !isUsd && aguinaldoAmount != null && aguinaldoInfo != null;
  const showSalaryLine = !isUsd;
  const currencyTagForFmt = currency;  // "ARS" or "USD" — feed to FormattedAmount
  const showDeficitAnterior = active.sobranteRaw < 0;
  const showDeficitRecurrente = deficitState.recurrente && !deficitRecurrenteDismissed;

  return (
    <Card className="h-fit">
      <TooltipProvider>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Resumen del Mes</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {selectedMonth === format(new Date(), "yyyy-MM")
                ? "Este mes"
                : format(parse(selectedMonth, "yyyy-MM", new Date()), "MMMM yyyy", { locale: es })}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onCurrencyToggle}
              title={`Cambiar a ${isUsd ? "ARS" : "USD"}`}
            >
              <DollarSign className="h-3 w-3 mr-1" />
              {currency}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Deficit recurrente banner */}
            {showDeficitRecurrente && (
              <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 p-3 text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  {deficitState.consecutiveNegativeMonths >= 2
                    ? `Venís en déficit ${deficitState.consecutiveNegativeMonths} meses seguidos`
                    : "Déficit acumulado supera el umbral configurado"}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mt-1 -mr-1"
                  onClick={onDismissDeficitRecurrente}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            {/* Deficit anterior banner */}
            {showDeficitAnterior && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>
                  Déficit anterior:{" "}
                  <FormattedAmount value={Math.abs(active.sobranteRaw)} currency={currencyTagForFmt} />
                </span>
              </div>
            )}

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

            {/* Ingreso fijo — ARS only */}
            {showSalaryLine && (
              <div className="flex justify-between">
                <span>Ingreso fijo:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={cn("font-medium text-green-600 dark:text-green-400 cursor-help", isPendiente && "opacity-50")}>
                      <FormattedAmount value={active.ingresoFijo} currency={currencyTagForFmt} />
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
            )}

            {/* Otros ingresos */}
            {active.otrosIngresos > 0 && (
              <div className="flex justify-between">
                <span>Otros ingresos:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-green-600 dark:text-green-400 cursor-help">
                      <FormattedAmount value={active.otrosIngresos} currency={currencyTagForFmt} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Suma de otros ingresos en {currency} del periodo</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Sobrante anterior — shown only if positive */}
            {displaySobrantePositive > 0 && (
              <div className="flex justify-between">
                <span>Sobrante anterior:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-green-600 dark:text-green-400 cursor-help">
                      <FormattedAmount value={displaySobrantePositive} currency={currencyTagForFmt} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Dinero que sobró del mes anterior y está disponible este mes</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Aguinaldo — ARS only */}
            {showAguinaldoLine && aguinaldoAmount != null && aguinaldoInfo && (
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
                    <FormattedAmount value={active.totalGastos} currency={currencyTagForFmt} />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Total gastos en {currency} del periodo</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Aportes inversiones (no neutros) */}
            {active.aportesNoNeutros > 0 && (
              <div className="flex justify-between">
                <span>Aportes inversión:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-blue-500 dark:text-blue-400 cursor-help">
                      <FormattedAmount value={-active.aportesNoNeutros} currency={currencyTagForFmt} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Aportes del periodo: <FormattedAmount value={active.aportesAll} currency="$" /></p>
                    <p>Neutros (tarjeta/objetivo): <FormattedAmount value={Math.max(0, active.aportesAll - active.aportesNoNeutros)} currency="$" /></p>
                    <p>Cuenta como egreso (ahorro/especulación): <FormattedAmount value={active.aportesNoNeutros} currency="$" /></p>
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
                  <span className={cn("font-bold", active.disponible >= 0 ? "text-green-500" : "text-red-500")}>
                    <FormattedAmount value={active.disponible} currency={currencyTagForFmt} />
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="font-bold mb-1">Disponible = Sobrante anterior + Ingresos − Gastos + Movimientos de caja</p>
                <p>Sobrante anterior: <FormattedAmount value={active.sobranteRaw} currency="$" /></p>
                {showSalaryLine && <p>+ Ingreso fijo: <FormattedAmount value={active.ingresoFijo} currency="$" /></p>}
                <p>+ Otros ingresos: <FormattedAmount value={active.otrosIngresos} currency="$" /></p>
                {showAguinaldoLine && <p>+ Aguinaldo: <FormattedAmount value={active.aguinaldo} currency="$" /></p>}
                <p className="text-red-400">− Gastos: <FormattedAmount value={active.totalGastos} currency="$" /></p>
                {active.cashEffect !== 0 && (
                  <p className="text-blue-400">
                    Movimientos de caja (aportes, USD, préstamos): <FormattedAmount value={active.cashEffect} currency="$" />
                  </p>
                )}
                <hr className="my-1 border-border" />
                <p className="font-bold">= <FormattedAmount value={active.disponible} currency="$" /></p>
              </TooltipContent>
            </Tooltip>

            {/* Resultado del mes — always visible */}
            <div className="flex justify-between text-sm text-muted-foreground -mt-2">
              <span>Resultado del mes:</span>
              <span className="tabular-nums">
                {active.resultadoDelMes >= 0 ? "+" : ""}
                <FormattedAmount value={active.resultadoDelMes} currency={currencyTagForFmt} />
              </span>
            </div>
          </div>
        </CardContent>
      </TooltipProvider>
    </Card>
  );
}
