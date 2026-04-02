"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormattedAmount } from "./formatted-amount";
import type { MonthlyData } from "@/hooks/useMoneyTracker";
import type { SalaryEntry, IncomeConfig, SalaryResolution } from "@/hooks/useSalaryHistory";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";

import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
} from "@/components/ui/tooltip";

interface SalaryCardProps {
  selectedMonth: string;
  monthlyData: MonthlyData;
  totalExpenses: number;
  availableMoney: number;
  savings: number;
  globalUsdRate: number;
  onSetGlobalUsdRate: (rate: number) => void;
  // Income config
  incomeConfig: IncomeConfig;
  onUpdateIncomeConfig: (config: IncomeConfig) => void;
  // Salary history
  salaryHistory: SalaryEntry[];
  onAddSalaryEntry: (entry: Omit<SalaryEntry, "id">) => void;
  onUpdateSalaryEntry: (id: string, updates: Partial<SalaryEntry>) => void;
  onDeleteSalaryEntry: (id: string) => void;
  currentMonthSalary: SalaryResolution;
  // Aguinaldo
  aguinaldoAmount: number | null; // null if not June/December or independiente
  aguinaldoInfo: { bestSalary: number; isOverride: boolean } | null;
  aguinaldoPreview: { estimatedAmount: number; bestSalary: number; targetMonth: string } | null;
  onSetAguinaldoOverride: (monthKey: string, amount: number) => void;
  onClearAguinaldoOverride: (monthKey: string) => void;
}

export function SalaryCard({
  selectedMonth,
  monthlyData,
  totalExpenses,
  availableMoney,
  globalUsdRate,
  onSetGlobalUsdRate,
  incomeConfig,
  onUpdateIncomeConfig,
  salaryHistory,
  onAddSalaryEntry,
  onUpdateSalaryEntry,
  onDeleteSalaryEntry,
  currentMonthSalary,
  aguinaldoAmount,
  aguinaldoInfo,
  aguinaldoPreview,
  onSetAguinaldoOverride,
  onClearAguinaldoOverride,
}: SalaryCardProps) {
  // USD rate editing
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState("");

  // Employment config editing
  const [editingEmploymentType, setEditingEmploymentType] = useState(false);
  const [editingPayDay, setEditingPayDay] = useState(false);
  const [payDayInput, setPayDayInput] = useState("");

  // Salary timeline editing
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryAmountInput, setEntryAmountInput] = useState("");
  const [entryRateInput, setEntryRateInput] = useState("");

  // Aguinaldo editing
  const [editingAguinaldo, setEditingAguinaldo] = useState(false);
  const [aguinaldoInput, setAguinaldoInput] = useState("");

  // Add new salary entry
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntryDate, setNewEntryDate] = useState(selectedMonth);
  const [newEntryAmount, setNewEntryAmount] = useState("");
  const [newEntryRate, setNewEntryRate] = useState("");

  const handleSubmitRate = () => {
    const newRate = parseFloat(rateInput);
    if (!isNaN(newRate) && newRate > 0) {
      onSetGlobalUsdRate(newRate);
      setEditingRate(false);
    }
  };

  const handleStartEditRate = () => {
    setRateInput(globalUsdRate > 0 ? String(globalUsdRate) : "");
    setEditingRate(true);
  };

  // Employment type toggle
  const handleToggleEmploymentType = (type: "dependiente" | "independiente") => {
    onUpdateIncomeConfig({ ...incomeConfig, employmentType: type });
    setEditingEmploymentType(false);
  };

  // Pay day editing
  const handleStartEditPayDay = () => {
    setPayDayInput(String(incomeConfig.payDay));
    setEditingPayDay(true);
  };

  const handleSubmitPayDay = () => {
    const val = parseInt(payDayInput, 10);
    if (!isNaN(val)) {
      const clamped = Math.max(1, Math.min(31, val));
      onUpdateIncomeConfig({ ...incomeConfig, payDay: clamped });
    }
    setEditingPayDay(false);
  };

  // Salary entry editing
  const handleStartEditEntry = (entry: SalaryEntry) => {
    setEditingEntryId(entry.id);
    setEntryAmountInput(String(entry.amount));
    setEntryRateInput(String(entry.usdRate));
  };

  const handleSubmitEntryEdit = (id: string) => {
    const amount = parseFloat(entryAmountInput);
    const usdRate = parseFloat(entryRateInput);
    if (!isNaN(amount) && amount > 0 && !isNaN(usdRate) && usdRate > 0) {
      onUpdateSalaryEntry(id, { amount, usdRate });
    }
    setEditingEntryId(null);
  };

  const handleCancelEntryEdit = () => {
    setEditingEntryId(null);
  };

  // Add new salary entry
  const handleSubmitNewEntry = () => {
    const amount = parseFloat(newEntryAmount);
    const usdRate = parseFloat(newEntryRate);
    if (!isNaN(amount) && amount > 0 && !isNaN(usdRate) && usdRate > 0 && newEntryDate) {
      onAddSalaryEntry({ effectiveDate: newEntryDate, amount, usdRate });
      setShowAddForm(false);
      setNewEntryAmount("");
      setNewEntryRate("");
      setNewEntryDate(selectedMonth);
    }
  };

  // Aguinaldo editing handlers
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

  // Format effective date for display
  const formatEffectiveDate = (dateStr: string): string => {
    try {
      const parsed = parse(dateStr, "yyyy-MM", new Date());
      return format(parsed, "MMM yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  // Sort entries most-recent-first for display
  const sortedHistory = [...salaryHistory].sort((a, b) =>
    b.effectiveDate.localeCompare(a.effectiveDate)
  );

  return (
    <Card className="h-fit">
      <TooltipProvider>
        <CardHeader>
          <CardTitle>Resumen del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Employment config section */}
            <div className="space-y-2 text-sm">
              {/* Employment type */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                {editingEmploymentType ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant={incomeConfig.employmentType === "dependiente" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleToggleEmploymentType("dependiente")}
                    >
                      Dependiente
                    </Button>
                    <Button
                      variant={incomeConfig.employmentType === "independiente" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleToggleEmploymentType("independiente")}
                    >
                      Independiente
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingEmploymentType(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-medium capitalize">
                      {incomeConfig.employmentType}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-blue-500"
                      onClick={() => setEditingEmploymentType(true)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Pay day */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dia de cobro:</span>
                {editingPayDay ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={payDayInput}
                      onChange={(e) => setPayDayInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSubmitPayDay();
                        }
                        if (e.key === "Escape") setEditingPayDay(false);
                      }}
                      className="h-7 w-16 text-sm"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleSubmitPayDay}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingPayDay(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{incomeConfig.payDay}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-blue-500"
                      onClick={handleStartEditPayDay}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Aguinaldo preview banner (May/November, dependiente only) */}
            {aguinaldoPreview && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-800 dark:text-blue-200">
                Aguinaldo estimado en {formatMonthName(aguinaldoPreview.targetMonth)}:{" "}
                <span className="font-medium">
                  <FormattedAmount value={aguinaldoPreview.estimatedAmount} currency="$" />
                </span>
                {" "}(50% de <FormattedAmount value={aguinaldoPreview.bestSalary} currency="$" />)
              </div>
            )}

            <hr className="border-border" />

            {/* Current month salary display */}
            <div className="flex justify-between">
              <span>Ingreso fijo:</span>
              <span className="font-medium">
                <FormattedAmount
                  value={currentMonthSalary.amount}
                  currency="ARS"
                />
                {currentMonthSalary.isOverride && (
                  <span className="ml-1 text-xs text-muted-foreground">(ajuste)</span>
                )}
              </span>
            </div>

            {/* Aguinaldo line (June/December, dependiente only) */}
            {aguinaldoAmount != null && aguinaldoInfo && (
              <div className="flex items-center justify-between">
                <span className="text-green-600 dark:text-green-400 text-sm">
                  Aguinaldo {aguinaldoInfo.isOverride ? "(ajuste)" : "(auto)"}:
                </span>
                {editingAguinaldo ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={aguinaldoInput}
                      onChange={(e) => setAguinaldoInput(e.target.value)}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleSubmitAguinaldo}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingAguinaldo(false)}
                    >
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
                        <p>50% del mejor sueldo del semestre (<FormattedAmount value={aguinaldoInfo.bestSalary} currency="$" />)</p>
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

            <div className="flex justify-between w-full">
              <span>Gastos:</span>
              <span className="font-medium text-red-500">
                <FormattedAmount value={totalExpenses} currency="ARS" />
              </span>
            </div>

            <Tooltip>
              <TooltipTrigger className="w-full">
                <div className="flex justify-between w-full">
                  <span className="block shrink-1">Disponible:</span>
                  <span className="font-medium text-green-500">
                    <FormattedAmount value={availableMoney} currency="ARS" />
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs mb-5">
                <p className="font-bold">Dinero disponible para gastos</p>
                <p>Total del mes - gastos del mes - inversiones del mes</p>
              </TooltipContent>
            </Tooltip>

            <hr className="border-border" />

            <div className="flex items-center justify-between">
              <span className="text-sm">Cotizacion USD:</span>
              {editingRate ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmitRate();
                      }
                      if (e.key === "Escape") setEditingRate(false);
                    }}
                    className="h-7 w-24 text-sm"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleSubmitRate}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditingRate(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-sm">
                    {globalUsdRate > 0
                      ? `$ ${globalUsdRate.toLocaleString()}`
                      : "Sin configurar"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleStartEditRate}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <hr className="border-border" />

            {/* Salary history timeline */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Historial</span>
              <div className="space-y-1">
                {sortedHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin historial de ingresos</p>
                ) : (
                  sortedHistory.map((entry) => (
                    <div key={entry.id} className="text-sm">
                      {editingEntryId === entry.id ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatEffectiveDate(entry.effectiveDate)}:
                            </span>
                            <Input
                              type="number"
                              value={entryAmountInput}
                              onChange={(e) => setEntryAmountInput(e.target.value)}
                              placeholder="Monto"
                              className="h-7 w-24 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSubmitEntryEdit(entry.id);
                                }
                                if (e.key === "Escape") handleCancelEntryEdit();
                              }}
                            />
                            <Input
                              type="number"
                              value={entryRateInput}
                              onChange={(e) => setEntryRateInput(e.target.value)}
                              placeholder="USD"
                              step="0.01"
                              className="h-7 w-20 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSubmitEntryEdit(entry.id);
                                }
                                if (e.key === "Escape") handleCancelEntryEdit();
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleSubmitEntryEdit(entry.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={handleCancelEntryEdit}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Desde {formatEffectiveDate(entry.effectiveDate)}:
                          </span>
                          <div className="flex items-center gap-1">
                            <FormattedAmount value={entry.amount} currency="$" className="font-medium" />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-blue-500"
                              onClick={() => handleStartEditEntry(entry)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-red-500"
                              onClick={() => onDeleteSalaryEntry(entry.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add new salary entry */}
              {showAddForm ? (
                <div className="space-y-2 rounded border border-border p-2">
                  <Input
                    type="month"
                    value={newEntryDate}
                    onChange={(e) => setNewEntryDate(e.target.value)}
                    className="h-7 text-xs"
                  />
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      placeholder="Monto"
                      value={newEntryAmount}
                      onChange={(e) => setNewEntryAmount(e.target.value)}
                      className="h-7 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Cotiz USD"
                      step="0.01"
                      value={newEntryRate}
                      onChange={(e) => setNewEntryRate(e.target.value)}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" className="h-7 text-xs" onClick={handleSubmitNewEntry}>
                      Guardar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewEntryAmount("");
                        setNewEntryRate("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => {
                    setNewEntryDate(selectedMonth);
                    setShowAddForm(true);
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Nuevo ingreso fijo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </TooltipProvider>
    </Card>
  );
}
