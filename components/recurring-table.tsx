"use client";

import type { RecurringExpense, RecurringStatus } from "@/hooks/useRecurringExpenses";
import { CurrencyType } from "@/constants/investments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pause, Pencil, Play, XCircle } from "lucide-react";

interface RecurringTableProps {
  recurrings: RecurringExpense[];
  onUpdateStatus: (id: string, status: RecurringStatus) => void;
  onEdit: (recurring: RecurringExpense) => void;
}

function formatAmount(amount: number, currencyType: CurrencyType): string {
  const prefix = currencyType === CurrencyType.USD ? "US$ " : "$ ";
  return prefix + amount.toLocaleString("es-AR", { minimumFractionDigits: 2 });
}

function statusBadge(status: RecurringStatus) {
  switch (status) {
    case "Activa":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
          Activa
        </Badge>
      );
    case "Pausada":
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
          Pausada
        </Badge>
      );
    case "Cancelada":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Cancelada
        </Badge>
      );
  }
}

export function RecurringTable({
  recurrings,
  onUpdateStatus,
  onEdit,
}: RecurringTableProps) {
  return (
    <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Moneda</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recurrings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No hay gastos recurrentes definidos
              </TableCell>
            </TableRow>
          ) : recurrings.map((rec) => (
            <TableRow
              key={rec.id}
              className={rec.status === "Cancelada" ? "opacity-50" : ""}
            >
              <TableCell className="font-medium">{rec.name}</TableCell>
              <TableCell>{formatAmount(rec.amount, rec.currencyType)}</TableCell>
              <TableCell>{rec.category}</TableCell>
              <TableCell>{rec.currencyType}</TableCell>
              <TableCell>{statusBadge(rec.status)}</TableCell>
              <TableCell>
                {rec.status === "Activa" && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Editar"
                      onClick={() => onEdit(rec)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Pausar"
                      onClick={() => onUpdateStatus(rec.id, "Pausada")}
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Cancelar"
                      onClick={() => onUpdateStatus(rec.id, "Cancelada")}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {rec.status === "Pausada" && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Editar"
                      onClick={() => onEdit(rec)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Reanudar"
                      onClick={() => onUpdateStatus(rec.id, "Activa")}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Cancelar"
                      onClick={() => onUpdateStatus(rec.id, "Cancelada")}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  );
}
