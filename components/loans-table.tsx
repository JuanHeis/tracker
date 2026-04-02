"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { LoanRow } from "./loan-row";
import { currencySymbol } from "@/constants/investments";
import type { Loan } from "@/hooks/useMoneyTracker";

interface LoansTableProps {
  loans: Loan[];
  onAddPayment: (loanId: string, data: { date: string; amount: number }) => void;
  onEditLoan: (loanId: string, updates: { persona?: string; note?: string; date?: string }) => void;
  onDeleteLoan: (loanId: string) => void;
  onForgiveLoan: (loanId: string) => void;
  onOpenDialog: () => void;
}

export function LoansTable({
  loans,
  onAddPayment,
  onEditLoan,
  onDeleteLoan,
  onForgiveLoan,
  onOpenDialog,
}: LoansTableProps) {
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null);
  const [forgiveTarget, setForgiveTarget] = useState<Loan | null>(null);

  const handleToggleExpand = (loanId: string) => {
    setExpandedLoanId((prev) => (prev === loanId ? null : loanId));
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteLoan(deleteTarget.id);
      setDeleteTarget(null);
      if (expandedLoanId === deleteTarget.id) {
        setExpandedLoanId(null);
      }
    }
  };

  const handleConfirmForgive = () => {
    if (forgiveTarget) {
      onForgiveLoan(forgiveTarget.id);
      setForgiveTarget(null);
    }
  };

  // Empty state
  if (loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground mb-1">
          No tenes prestamos registrados
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Registra prestamos dados o deudas para trackear tu patrimonio real
        </p>
        <Button onClick={onOpenDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo prestamo
        </Button>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Persona</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Resta</TableHead>
            <TableHead>Moneda</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.map((loan) => (
            <LoanRow
              key={loan.id}
              loan={loan}
              isExpanded={expandedLoanId === loan.id}
              onToggleExpand={() => handleToggleExpand(loan.id)}
              onAddPayment={onAddPayment}
              onEdit={onEditLoan}
              onDelete={(id) => {
                const target = loans.find((l) => l.id === id);
                if (target) setDeleteTarget(target);
              }}
              onForgive={(id) => {
                const target = loans.find((l) => l.id === id);
                if (target) setForgiveTarget(target);
              }}
            />
          ))}
        </TableBody>
      </Table>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar prestamo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se revertira todo el impacto financiero como si nunca existiera. Esta accion no se puede deshacer.
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

      {/* Forgive confirmation dialog */}
      <AlertDialog open={!!forgiveTarget} onOpenChange={(open) => !open && setForgiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Perdonar prestamo?</AlertDialogTitle>
            <AlertDialogDescription>
              {forgiveTarget && (() => {
                const remaining = forgiveTarget.amount - forgiveTarget.payments.reduce((sum, p) => sum + p.amount, 0);
                const symbol = currencySymbol(forgiveTarget.currencyType);
                return `Se cancela el saldo restante de ${symbol}${remaining.toLocaleString()}. Tu patrimonio disminuira. Los pagos ya registrados se mantienen.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmForgive}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Perdonar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
