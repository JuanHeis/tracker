"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExtraIncome } from "@/hooks/useExpenseTracker";

interface IncomeTableProps {
  incomes: ExtraIncome[];
  onDeleteIncome: (id: string) => void;
}

export default function IncomeTable({ 
  incomes,
  onDeleteIncome 
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
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Monto (ARS)</TableHead>
              <TableHead>Monto (USD)</TableHead>
              <TableHead>Acciones</TableHead>
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
                  <TableCell>
                    {format(new Date(income.date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{income.name}</TableCell>
                  <TableCell>
                    ARS {income.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    USD {(income.amount / income.usdRate).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteIncome(income.id)}
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
      </CardContent>
    </Card>
  );
}