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
  const className = "text-center";
  if (!isHydrated) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={className}>Fecha</TableHead>
            <TableHead className={className}>Descripción</TableHead>
            <TableHead className={className}>Monto</TableHead>
            <TableHead className={className}>USD</TableHead>
            <TableHead className={className}>Acciones</TableHead>
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
          <TableHead className={className}>Fecha</TableHead>
          <TableHead className={className}>Descripción</TableHead>
          <TableHead className={className}>Monto</TableHead>
          <TableHead className={className}>USD</TableHead>
          <TableHead className={className}>Acciones</TableHead>
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
              <TableCell className={className}>
                <FormattedDate date={income.date} />
              </TableCell>
              <TableCell className={className}>{income.name}</TableCell>
              <TableCell className={className}>
                <span
                  className={
                    income.currencyType === CurrencyType.ARS ? "font-bold" : ""
                  }
                >
                  <FormattedAmount value={income.amount} currency="ARS" />
                </span>
              </TableCell>
              <TableCell className={className}>
                <span
                  className={
                    income.currencyType === CurrencyType.USD ? "font-bold" : ""
                  }
                >
                  <FormattedAmount
                    value={income.amount / income.usdRate}
                    currency="USD"
                  />
                </span>
              </TableCell>
              <TableCell className={className}>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer text-blue-500 group/edit hover:bg-blue-500 hover:text-white"
                    onClick={() => onEditIncome(income)}
                  >
                    <Pencil className="h-4 w-4 group-hover/edit:scale-125" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer text-red-500 group/delete hover:bg-red-500 hover:text-white"
                    onClick={() => onDeleteIncome(income.id)}
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
