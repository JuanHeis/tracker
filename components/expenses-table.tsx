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

const className = "text-center";

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
            <TableHead className={className}>Fecha</TableHead>
            <TableHead className={className}>Nombre</TableHead>
            <TableHead className={className}>Categoría</TableHead>
            <TableHead className={className}>Monto</TableHead>
            <TableHead className={className}>USD</TableHead>
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
          <TableHead className={className}>Categoría</TableHead>
          <TableHead className={className}>Monto</TableHead>
          <TableHead className={className}>USD</TableHead>
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
          expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className={className}>
                <FormattedDate date={expense.date} />
              </TableCell>
              <TableCell className={className}>
                {expense.name}
                {expense.installments && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({expense.installments.current}/{expense.installments.total}
                    )
                  </span>
                )}
              </TableCell>
              <TableCell className={className}>
                <Badge
                  className={
                    categories[expense.category]?.color ?? "bg-background"
                  }
                >
                  {expense.category}
                </Badge>
              </TableCell>
              <TableCell className={className}>
                <span
                  className={
                    expense.currencyType === CurrencyType.ARS ? "font-bold" : ""
                  }
                >
                  <FormattedAmount value={expense.amount} currency="ARS" />
                </span>
              </TableCell>
              <TableCell className={className}>
                <span
                  className={
                    expense.currencyType === CurrencyType.USD ? "font-bold" : ""
                  }
                >
                  <FormattedAmount
                    value={expense.amount / expense.usdRate}
                    currency="USD"
                  />
                </span>
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
          ))
        )}
      </TableBody>
    </Table>
  );
}
