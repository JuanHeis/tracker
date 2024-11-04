"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface SalaryCardProps {
  selectedMonth: string;
  monthlyData: {
    salaries: {
      [key: string]: {
        amount: number;
        usdRate: number;
      };
    };
  };
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
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Mes Actual</CardTitle>
      </CardHeader>
      <CardContent>
        {!monthlyData.salaries[selectedMonth] || showSalaryForm ? (
          <form onSubmit={onSalarySubmit} className="space-y-4">
            <Input
              type="number"
              placeholder="Salario (ARS)"
              name="salary"
              defaultValue={monthlyData.salaries[selectedMonth]?.amount}
              required
            />
            <Input
              type="number"
              placeholder="Valor USD"
              name="usdRate"
              step="0.01"
              defaultValue={monthlyData.salaries[selectedMonth]?.usdRate}
              required
            />
            <div className="flex gap-2">
              <Button type="submit">Guardar</Button>
              {monthlyData.salaries[selectedMonth] && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onShowFormChange(false)}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Salario:</span>
              <span className="font-medium">
                ARS {monthlyData.salaries[selectedMonth].amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>En USD:</span>
              <span className="font-medium">
                USD{" "}
                {(
                  monthlyData.salaries[selectedMonth].amount /
                  monthlyData.salaries[selectedMonth].usdRate
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>Gastos:</span>
              <span className="font-medium">
                ARS {totalExpenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-green-500">
              <span>Disponible:</span>
              <span className="font-medium">
                ARS {availableMoney.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ahorrado:</span>
              <span className="font-medium">
                ARS {savings.toLocaleString()}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => onShowFormChange(true)}
              className="w-full"
            >
              Editar Salario
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 