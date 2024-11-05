"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
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
  onSalarySubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onShowFormChange: (show: boolean) => void;
}

export function SalaryCard({
  selectedMonth,
  monthlyData,
  showSalaryForm,
  totalExpenses,
  availableMoney,
  onSalarySubmit,
  onShowFormChange,
}: SalaryCardProps) {
  const currentSalary = monthlyData.salaries[selectedMonth];

  useEffect(() => {
    if (monthlyData.salaries[selectedMonth]) {
      onShowFormChange(false);
    } else {
      onShowFormChange(true);
    }
  }, [selectedMonth]);
  return (
    <Card className="h-fit">
      <TooltipProvider>
        <CardHeader>
          <CardTitle>Resumen del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          {showSalaryForm ? (
            <form onSubmit={onSalarySubmit} className="space-y-4">
              <Input
                type="number"
                placeholder="Salario"
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
                <span>Salario:</span>
                <span className="font-medium">
                  <FormattedAmount
                    value={currentSalary?.amount || 0}
                    currency="ARS"
                  />
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger className="w-full ">
                  <div className="flex justify-between w-full ">
                    <span>Salario (USD):</span>
                    <span className="font-medium text-green-800">
                      <FormattedAmount
                        value={
                          Number(
                            (
                              currentSalary?.amount / currentSalary?.usdRate
                            ).toFixed(2)
                          ) || 0
                        }
                        currency="USD"
                      />
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs mb-5">
                  <p className="font-bold">Salario en dolares</p>
                  <p>
                    Salario en pesos / valor del dolar ($
                    {currentSalary?.usdRate})
                  </p>
                </TooltipContent>
              </Tooltip>

              <div className="flex justify-between w-full">
                <span>Gastos:</span>
                <span className="font-medium text-red-500">
                  <FormattedAmount value={totalExpenses} currency="ARS" />
                </span>
              </div>

              <Tooltip>
                <TooltipTrigger className="w-full ">
                  <div className="flex justify-between w-full ">
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

              <Button
                variant="outline"
                className="w-full"
                onClick={() => onShowFormChange(true)}
              >
                Editar Salario
              </Button>
            </div>
          )}
        </CardContent>
      </TooltipProvider>
    </Card>
  );
}
