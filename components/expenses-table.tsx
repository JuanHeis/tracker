"use client";

import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Expense, Category, CurrencyType } from "@/hooks/useMoneyTracker";
import { useHydration } from "@/hooks/useHydration";
import { FormattedDate } from "./formatted-date";
import { FormattedAmount } from "./formatted-amount";

interface ExpensesTableProps {
  expenses: Expense[];
  categories: Record<Category, { color: string }>;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: Expense) => void;
}

export function ExpensesTable({
  expenses,
  categories,
  onDeleteExpense,
  onEditExpense,
}: ExpensesTableProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">USD</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
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
          <TableHead>Fecha</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead className="text-right">USD</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
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
          expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>
                <FormattedDate date={expense.date} />
              </TableCell>
              <TableCell>
                {expense.name}
                {expense.installments && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({expense.installments.current}/{expense.installments.total})
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={categories[expense.category]?.color ?? "bg-background"}>
                  {expense.category}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className={expense.currencyType === CurrencyType.ARS ? "font-bold" : ""}>
                  <FormattedAmount value={expense.amount} currency="ARS" />
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className={expense.currencyType === CurrencyType.USD ? "font-bold" : ""}>
                  <FormattedAmount value={expense.amount / expense.usdRate} currency="USD" />
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditExpense(expense)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteExpense(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
