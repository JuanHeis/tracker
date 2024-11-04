"use client";

import { format } from "date-fns";
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
import { Expense, Category } from "@/hooks/useExpenseTracker";

const className = "text-center ";
interface ExpensesTableProps {
  expenses: Expense[];
  categories: Record<string, { color: string }>;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expenseToEdit: Expense) => void;
}

export function ExpensesTable({
  expenses,
  categories,
  onDeleteExpense,
  onEditExpense,
}: ExpensesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={className}>Fecha</TableHead>
          <TableHead className={className}>Nombre</TableHead>
          <TableHead className={className}>Monto (ARS)</TableHead>
          <TableHead className={className}>Monto (USD)</TableHead>
          <TableHead className={className}>USD Exchange</TableHead>
          <TableHead className={className}>Categoría</TableHead>
          <TableHead className={className}>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center text-muted-foreground"
            >
              No hay gastos cargados este mes
            </TableCell>
          </TableRow>
        ) : (
          expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className={className}>
                {format(new Date(expense.date), "dd/MM/yyyy")}
              </TableCell>
              <TableCell className={className}>
                {expense.name}
                {expense.installments && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({expense.installments.current}/{expense.installments.total}
                    )
                  </span>
                )}
              </TableCell>
              <TableCell className={className}>
                ARS {expense.amount.toLocaleString()}
              </TableCell>
              <TableCell className={className}>
                USD {(expense.amount / expense.usdRate).toFixed(2)}
              </TableCell>
              <TableCell className={className}>
                {expense.usdRate.toFixed(2)}
              </TableCell>
              <TableCell className={className}>
                <Badge className={categories[expense.category].color}>
                  {expense.category}
                </Badge>
              </TableCell>
              <TableCell className={className}>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditExpense(expense)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteExpense(expense.id)}
                    className="text-red-500 hover:text-red-700"
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
