"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/currency-input";
import {
  SimulatedExpense,
  applySimulatedExpenses,
  computeSimulatorSummary,
  buildSimulatorData,
} from "@/lib/projection/simulator";
import { estimateMonthlyNetSavings } from "@/lib/projection/income-projection";
import { projectPatrimonyScenarios } from "@/lib/projection/scenario-engine";
import { SimulatorChart } from "@/components/charts/simulator-chart";
import { CurrencyType } from "@/constants/investments";
import { Trash2, AlertTriangle } from "lucide-react";
import type { RecurringExpense } from "@/hooks/useRecurringExpenses";
import type { Investment } from "@/hooks/useMoneyTracker";
import type { CustomAnnualRates } from "@/lib/projection/types";
import { computeInvestmentGrowth } from "@/hooks/useProjectionEngine";

interface SimulatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPatrimony: number;
  currentSalary: number;
  recurringExpenses: RecurringExpense[];
  globalUsdRate: number;
  investments: Investment[];
  customAnnualRates?: CustomAnnualRates;
}

const formatArs = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function SimulatorDialog({
  open,
  onOpenChange,
  currentPatrimony,
  currentSalary,
  recurringExpenses,
  globalUsdRate,
  investments,
  customAnnualRates,
}: SimulatorDialogProps) {
  const [expenses, setExpenses] = useState<SimulatedExpense[]>([]);
  const [horizonMonths, setHorizonMonths] = useState(12);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState(0);
  const [formInstallments, setFormInstallments] = useState(1);
  const [formCurrency, setFormCurrency] = useState<CurrencyType>(CurrencyType.ARS);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setExpenses([]);
      setFormName("");
      setFormAmount(0);
      setFormInstallments(1);
      setFormCurrency(CurrencyType.ARS);
    }
  }, [open]);

  // Projection computation
  const { chartData, summary } = useMemo(() => {
    const netSavings = estimateMonthlyNetSavings(
      currentSalary,
      recurringExpenses,
      globalUsdRate
    );
    const scenarios = projectPatrimonyScenarios(
      currentPatrimony,
      netSavings,
      horizonMonths
    );
    // Layer investment growth onto base scenario (rateMultiplier=1.0)
    const { growth: investmentGrowth } = computeInvestmentGrowth(
      investments,
      1.0,
      horizonMonths,
      false, // includeContributions — conservative estimate
      globalUsdRate,
      customAnnualRates,
    );
    const baseProjection = scenarios.base.map((v, m) => v + investmentGrowth[m]);
    const simulatedProjection = applySimulatedExpenses(
      baseProjection,
      expenses,
      globalUsdRate
    );
    const chartData = buildSimulatorData(
      baseProjection,
      simulatedProjection,
      horizonMonths
    );
    const summary = computeSimulatorSummary(
      expenses,
      simulatedProjection,
      globalUsdRate
    );
    return { chartData, summary };
  }, [
    currentPatrimony,
    currentSalary,
    recurringExpenses,
    globalUsdRate,
    horizonMonths,
    expenses,
    investments,
    customAnnualRates,
  ]);

  const addExpense = useCallback(() => {
    if (!formName.trim() || formAmount <= 0 || formInstallments < 1) return;

    const newExpense: SimulatedExpense = {
      id: typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(),
      name: formName.trim(),
      totalAmount: formAmount,
      installments: formInstallments,
      currencyType: formCurrency,
    };

    setExpenses((prev) => [...prev, newExpense]);
    setFormName("");
    setFormAmount(0);
    setFormInstallments(1);
    setFormCurrency(CurrencyType.ARS);
  }, [formName, formAmount, formInstallments, formCurrency]);

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const monthlyInstallment =
    formInstallments > 1 && formAmount > 0
      ? formAmount / formInstallments
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Simulador de Gastos</DialogTitle>
          <DialogDescription>
            Simula gastos futuros y visualiza el impacto en tu patrimonio
          </DialogDescription>
        </DialogHeader>

        {/* Horizon selector */}
        <div className="flex items-center justify-end gap-2">
          <label className="text-sm text-muted-foreground">Horizonte</label>
          <Select
            value={horizonMonths.toString()}
            onValueChange={(v) => setHorizonMonths(Number(v))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
              <SelectItem value="24">24 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add expense form */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Agregar gasto simulado</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Nombre</label>
              <Input
                placeholder="Ej: Notebook"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Monto total</label>
              <CurrencyInput
                value={formAmount || ""}
                onValueChange={(v) => setFormAmount(v)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Cuotas</label>
              <Input
                type="number"
                min={1}
                value={formInstallments}
                onChange={(e) =>
                  setFormInstallments(Math.max(1, parseInt(e.target.value) || 1))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Moneda</label>
              <Select
                value={formCurrency}
                onValueChange={(v) => setFormCurrency(v as CurrencyType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CurrencyType.ARS}>ARS</SelectItem>
                  <SelectItem value={CurrencyType.USD}>USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {monthlyInstallment !== null && (
            <p className="text-xs text-muted-foreground">
              Cuota mensual: ${monthlyInstallment.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
              {" "}{formCurrency}
            </p>
          )}
          <Button
            onClick={addExpense}
            disabled={!formName.trim() || formAmount <= 0}
            size="sm"
          >
            Agregar gasto
          </Button>
        </div>

        {/* Expense list */}
        {expenses.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Gastos simulados ({expenses.length})
            </label>
            <div className="space-y-1">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{expense.name}</span>
                    <span className="ml-2 text-muted-foreground">
                      {expense.currencyType === CurrencyType.USD ? "USD " : "$"}
                      {expense.totalAmount.toLocaleString("es-AR", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    {expense.installments > 1 && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({expense.installments} cuotas de{" "}
                        {expense.currencyType === CurrencyType.USD ? "USD " : "$"}
                        {(expense.totalAmount / expense.installments).toLocaleString(
                          "es-AR",
                          { maximumFractionDigits: 0 }
                        )}
                        )
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => removeExpense(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chart and summary */}
        {expenses.length > 0 ? (
          <div className="space-y-4">
            <div className="aspect-[2/1]">
              <SimulatorChart data={chartData} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border p-3 text-center">
                <p className="text-xs text-muted-foreground">Costo total</p>
                <p className="text-sm font-semibold">
                  {formatArs.format(summary.totalCost)}
                </p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Max. impacto mensual
                </p>
                <p className="text-sm font-semibold">
                  {formatArs.format(summary.maxMonthlyImpact)}
                </p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-xs text-muted-foreground">Saldo minimo</p>
                <p
                  className={`text-sm font-semibold flex items-center justify-center gap-1 ${
                    summary.worstBalance < 0 ? "text-red-500" : ""
                  }`}
                >
                  {summary.worstBalance < 0 && (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  {formatArs.format(summary.worstBalance)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">
            Agrega gastos para ver el impacto en tu proyeccion
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
