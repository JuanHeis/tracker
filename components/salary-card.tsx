"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
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

import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
} from "@/components/ui/tooltip";

interface SalaryCardProps {
  selectedMonth: string;
  monthlyData: MonthlyData;
  showSalaryForm: boolean;
  totalExpenses: number;
  availableMoney: number;
  savings: number;
  globalUsdRate: number;
  onSetGlobalUsdRate: (rate: number) => void;
  onSalarySubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onShowFormChange: (show: boolean) => void;
}

export function SalaryCard({
  selectedMonth,
  monthlyData,
  showSalaryForm,
  totalExpenses,
  availableMoney,
  globalUsdRate,
  onSetGlobalUsdRate,
  onSalarySubmit,
  onShowFormChange,
}: SalaryCardProps) {
  const currentSalary = monthlyData.salaries[selectedMonth];

  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState("");

  useEffect(() => {
    if (monthlyData.salaries[selectedMonth]) {
      onShowFormChange(false);
    } else {
      onShowFormChange(true);
    }
  }, [selectedMonth]);

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

  return (
    <Card className="h-fit">
      <TooltipProvider>
        <CardHeader>
          <CardTitle>Resumen del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          {showSalaryForm ? (
            <form onSubmit={onSalarySubmit} className="space-y-4" key={`salary-form-${selectedMonth}-${showSalaryForm}`}>
              <Input
                type="number"
                placeholder="Ingreso fijo"
                name="salary"
                defaultValue={currentSalary?.amount}
                required
              />
              <Input
                type="number"
                placeholder="Valor USD"
                name="usdRate"
                step="0.01"
                defaultValue={currentSalary?.usdRate}
                required
              />
              <Button type="submit">Guardar</Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Ingreso fijo:</span>
                <span className="font-medium">
                  <FormattedAmount
                    value={currentSalary?.amount || 0}
                    currency="ARS"
                  />
                </span>
              </div>

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

              <Button
                variant="outline"
                className="w-full"
                onClick={() => onShowFormChange(true)}
              >
                Editar Ingreso fijo
              </Button>
            </div>
          )}
        </CardContent>
      </TooltipProvider>
    </Card>
  );
}
