"use client";

import { useState } from "react";
import { format, parse } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormattedAmount } from "@/components/formatted-amount";
import type { Transfer } from "@/hooks/useMoneyTracker";

interface MovementsTableProps {
  transfers: Transfer[];
  onDeleteTransfer: (id: string) => void;
  globalUsdRate: number;
}

function getTypeBadge(type: Transfer["type"]) {
  switch (type) {
    case "currency_ars_to_usd":
    case "currency_usd_to_ars":
      return <Badge variant="default">Transferencia</Badge>;
    case "cash_out":
      return <Badge variant="outline" className="border-destructive text-destructive">Retiro</Badge>;
    case "cash_in":
      return <Badge variant="secondary">Deposito</Badge>;
    case "adjustment_ars":
    case "adjustment_usd":
      return <Badge variant="outline">Ajuste</Badge>;
    default:
      return <Badge variant="outline">Otro</Badge>;
  }
}

function getDescription(transfer: Transfer): string {
  switch (transfer.type) {
    case "currency_ars_to_usd":
      return `ARS \u2192 USD @ ${transfer.exchangeRate?.toLocaleString()}`;
    case "currency_usd_to_ars":
      return `USD \u2192 ARS @ ${transfer.exchangeRate?.toLocaleString()}`;
    case "cash_out":
      return `Retiro a efectivo (${transfer.currency})`;
    case "cash_in":
      return transfer.description || `Deposito desde efectivo (${transfer.currency})`;
    case "adjustment_ars":
      return "Ajuste saldo ARS";
    case "adjustment_usd":
      return "Ajuste saldo USD";
    default:
      return "";
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = parse(dateStr, "yyyy-MM-dd", new Date());
    return format(d, "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}

export function MovementsTable({
  transfers,
  onDeleteTransfer,
}: MovementsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteTransfer(deleteTarget);
      setDeleteTarget(null);
    }
  };

  if (transfers.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No hay movimientos en este periodo
      </p>
    );
  }

  return (
    <>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2 font-medium">Fecha</th>
            <th className="text-left py-2 px-2 font-medium">Tipo</th>
            <th className="text-left py-2 px-2 font-medium">Descripcion</th>
            <th className="text-right py-2 px-2 font-medium">Monto</th>
            <th className="text-right py-2 px-2 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer) => (
            <tr key={transfer.id} className="border-b">
              <td className="py-2 px-2">{formatDate(transfer.date)}</td>
              <td className="py-2 px-2">{getTypeBadge(transfer.type)}</td>
              <td className="py-2 px-2">{getDescription(transfer)}</td>
              <td className="py-2 px-2 text-right">
                <TransferAmount transfer={transfer} />
              </td>
              <td className="py-2 px-2 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  onClick={() => setDeleteTarget(transfer.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar transferencia?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminara esta transferencia permanentemente. Esta accion no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

function TransferAmount({ transfer }: { transfer: Transfer }) {
  switch (transfer.type) {
    case "currency_ars_to_usd":
      return (
        <span className="flex flex-col items-end gap-0.5">
          <FormattedAmount value={-(transfer.arsAmount ?? 0)} currency="$" className="text-red-500" />
          <FormattedAmount value={transfer.usdAmount ?? 0} currency="US$" className="text-green-600" />
        </span>
      );
    case "currency_usd_to_ars":
      return (
        <span className="flex flex-col items-end gap-0.5">
          <FormattedAmount value={-(transfer.usdAmount ?? 0)} currency="US$" className="text-red-500" />
          <FormattedAmount value={transfer.arsAmount ?? 0} currency="$" className="text-green-600" />
        </span>
      );
    case "cash_out":
      return (
        <FormattedAmount
          value={-(transfer.amount ?? 0)}
          currency={transfer.currency === "USD" ? "US$" : "$"}
          className="text-red-500"
        />
      );
    case "cash_in":
      return (
        <FormattedAmount
          value={transfer.amount ?? 0}
          currency={transfer.currency === "USD" ? "US$" : "$"}
          className="text-green-600"
        />
      );
    case "adjustment_ars":
      return (
        <FormattedAmount
          value={transfer.amount ?? 0}
          currency="$"
          className={(transfer.amount ?? 0) >= 0 ? "text-green-600" : "text-red-500"}
        />
      );
    case "adjustment_usd":
      return (
        <FormattedAmount
          value={transfer.amount ?? 0}
          currency="US$"
          className={(transfer.amount ?? 0) >= 0 ? "text-green-600" : "text-red-500"}
        />
      );
    default:
      return <span>-</span>;
  }
}
