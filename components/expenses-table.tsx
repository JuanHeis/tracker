"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";
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

interface Expense {
  id: string;
  date: string;
  name: string;
  amount: number;
  usdRate: number;
  category: string;
  installments?: {
    total: number;
    current: number;
  };
}

interface ExpensesTableProps {
  expenses: Expense[];
  categories: Record<string, { color: string }>;
  onDeleteExpense: (id: string) => void;
}

export function ExpensesTable({ 
  expenses, 
  categories, 
  onDeleteExpense 
}: ExpensesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Precio (ARS)</TableHead>
          <TableHead>Precio (USD)</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Acciones</TableHead>
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
              <TableCell>
                {format(new Date(expense.date), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>
                {expense.name}
                {expense.installments && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({expense.installments.current}/{expense.installments.total})
                  </span>
                )}
              </TableCell>
              <TableCell>
                ARS {expense.amount.toLocaleString()}
              </TableCell>
              <TableCell>
                USD {(expense.amount / expense.usdRate).toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge className={categories[expense.category].color}>
                  {expense.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteExpense(expense.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
} 