"use client";

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
import { ExtraIncome, CurrencyType } from "@/hooks/useMoneyTracker";
import { FormattedAmount } from "./formatted-amount";
import { FormattedDate } from "./formatted-date";
import { useHydration } from "@/hooks/useHydration";

interface IncomeTableProps {
  incomes: ExtraIncome[];
  onDeleteIncome: (id: string) => void;
  onEditIncome: (income: ExtraIncome) => void;
}

export default function IncomeTable({
  incomes,
  onDeleteIncome,
  onEditIncome,
}: IncomeTableProps) {
  const isHydrated = useHydration();

  if (!isHydrated) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">USD</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5} className="text-center">
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
          <TableHead>Descripción</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead className="text-right">USD</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {incomes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              No hay ingresos extra este mes
            </TableCell>
          </TableRow>
        ) : (
          incomes.map((income) => (
            <TableRow key={income.id}>
              <TableCell>
                <FormattedDate date={income.date} />
              </TableCell>
              <TableCell>{income.name}</TableCell>
              <TableCell className="text-right">
                <span className={income.currencyType === CurrencyType.ARS ? "font-bold" : ""}>
                  <FormattedAmount value={income.amount} currency="ARS" />
                </span>
              </TableCell>
              <TableCell className="text-right">
                <span className={income.currencyType === CurrencyType.USD ? "font-bold" : ""}>
                  <FormattedAmount value={income.amount / income.usdRate} currency="USD" />
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditIncome(income)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteIncome(income.id)}
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
