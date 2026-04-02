"use client";

import { useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Expense, CurrencyType } from "@/hooks/useMoneyTracker";
import { currencySymbol } from "@/constants/investments";
import { useHydration } from "@/hooks/useHydration";
import { FormattedDate } from "./formatted-date";
import { FormattedAmount } from "./formatted-amount";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/constants/colors";

interface ExpensesTableProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
  onUpdateUsdRate: (expenseId: string, newRate: number) => void;
}

const className = "text-center";

function InlineRateEditor({
  currentRate,
  onSave,
  onCancel,
}: {
  currentRate: number;
  onSave: (newRate: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(String(currentRate));

  const handleSave = () => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      onSave(num);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
          if (e.key === "Escape") onCancel();
        }}
        className="h-6 w-20 text-xs"
        autoFocus
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleSave}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onCancel}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function ExpensesTable({
  expenses,
  onDeleteExpense,
  onEditExpense,
  onUpdateUsdRate,
}: ExpensesTableProps) {
  const isHydrated = useHydration();
  const [editingRateId, setEditingRateId] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={className}>Fecha</TableHead>
            <TableHead className={className}>Nombre</TableHead>
            <TableHead className={className}>Categoria</TableHead>
            <TableHead className={className}>Monto</TableHead>
            <TableHead className={className}>Cotizacion</TableHead>
            <TableHead className={className}>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              Cargando...
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={className}>Fecha</TableHead>
          <TableHead className={className}>Nombre</TableHead>
          <TableHead className={className}>Categoria</TableHead>
          <TableHead className={className}>Monto</TableHead>
          <TableHead className={className}>Cotizacion</TableHead>
          <TableHead className={className}>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              No hay gastos cargados este mes
            </TableCell>
          </TableRow>
        ) : (
          expenses.map((expense) => {
            const isUsd = expense.currencyType === CurrencyType.USD;
            return (
              <TableRow key={expense.id}>
                <TableCell className={className}>
                  <FormattedDate date={expense.date} />
                </TableCell>
                <TableCell className={className}>
                  {expense.name}
                  {expense.installments && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({expense.installments.current}/
                      {expense.installments.total})
                    </span>
                  )}
                </TableCell>
                <TableCell className={className}>
                  <Badge
                    style={{
                      backgroundColor: CATEGORIES[expense.category]?.color,
                    }}
                  >
                    {expense.category}
                  </Badge>
                </TableCell>
                <TableCell className={className}>
                  <span className={cn(
                    "font-medium",
                    isUsd && "text-green-600 dark:text-green-400"
                  )}>
                    <FormattedAmount
                      value={expense.amount}
                      currency={currencySymbol(expense.currencyType || CurrencyType.ARS)}
                    />
                  </span>
                </TableCell>
                <TableCell className={className}>
                  {editingRateId === expense.id ? (
                    <InlineRateEditor
                      currentRate={expense.usdRate}
                      onSave={(newRate) => {
                        onUpdateUsdRate(expense.id, newRate);
                        setEditingRateId(null);
                      }}
                      onCancel={() => setEditingRateId(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {expense.usdRate > 0
                          ? `$${expense.usdRate.toLocaleString()}`
                          : "-"}
                      </span>
                      {expense.usdRate > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-blue-500"
                          onClick={() => setEditingRateId(expense.id)}
                          title="Editar cotizacion"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className={className}>
                  <div className="flex justify-center gap-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer text-blue-500 group/edit hover:bg-blue-500 hover:text-white"
                      onClick={() => onEditExpense(expense)}
                    >
                      <Pencil className="h-4 w-4 group-hover/edit:scale-125" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer text-red-500 group/delete hover:bg-red-500 hover:text-white"
                      onClick={() => onDeleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4 group-hover/delete:scale-125" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
