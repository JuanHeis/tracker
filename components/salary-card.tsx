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
  savings,
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
  });
  return (
    <Card className="h-fit">
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
            <div className="flex justify-between">
              <span>Gastos:</span>
              <span className="font-medium text-red-500">
                <FormattedAmount value={totalExpenses} currency="ARS" />
              </span>
            </div>
            <div className="flex justify-between">
              <span>Disponible:</span>
              <span className="font-medium">
                <FormattedAmount value={availableMoney} currency="ARS" />
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ahorro:</span>
              <span className="font-medium text-green-500">
                <FormattedAmount value={savings} currency="ARS" />
              </span>
            </div>
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
    </Card>
  );
}
