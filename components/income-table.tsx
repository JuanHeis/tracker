"use client";

import { format } from "date-fns";
import { Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExtraIncome } from "@/hooks/useExpenseTracker";

interface IncomeTableProps {
  incomes: ExtraIncome[];
  onDeleteIncome: (id: string) => void;
  onEditIncome: (income: ExtraIncome) => void;
}

const className = "text-center";

export default function IncomeTable({
  incomes,
  onDeleteIncome,
  onEditIncome,
}: IncomeTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos Extra del Mes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={className}>Fecha</TableHead>
              <TableHead className={className}>Descripción</TableHead>
              <TableHead className={className}>Monto (ARS)</TableHead>
              <TableHead className={className}>Monto (USD)</TableHead>
              <TableHead className={className}>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incomes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No hay ingresos extra este mes
                </TableCell>
              </TableRow>
            ) : (
              incomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell className={className}>
                    {format(new Date(income.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className={className}>{income.name}</TableCell>
                  <TableCell className={className}>
                    ARS {income.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className={className}>
                    USD {(income.amount / income.usdRate).toFixed(2)}
                  </TableCell>
                  <TableCell className={className}>
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditIncome(income)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteIncome(income.id)}
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
      </CardContent>
    </Card>
  );
}
