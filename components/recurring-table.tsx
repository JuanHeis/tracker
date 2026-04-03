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
import { Pause, Play, XCircle, Plus, Repeat } from "lucide-react";

interface RecurringTableProps {
  recurrings: RecurringExpense[];
  onUpdateStatus: (id: string, status: RecurringStatus) => void;
  onAddClick: () => void;
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
  onAddClick,
}: RecurringTableProps) {
  if (recurrings.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Gastos Recurrentes
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground mb-1">
            No hay gastos recurrentes definidos
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Agrega gastos que se repiten cada mes para trackearlos automaticamente
          </p>
          <Button onClick={onAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar recurrente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Repeat className="h-5 w-5" />
          Gastos Recurrentes
        </h3>
        <Button size="sm" onClick={onAddClick}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>
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
          {recurrings.map((rec) => (
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
    </div>
  );
}
