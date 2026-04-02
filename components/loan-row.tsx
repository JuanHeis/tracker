"use client";

import { format, parse } from "date-fns";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { TableRow, TableCell } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { LoanPayments } from "./loan-payments";
import { useHydration } from "@/hooks/useHydration";
import { DATE_FORMAT } from "@/constants/date";
import { currencySymbol } from "@/constants/investments";
import type { Loan } from "@/hooks/useMoneyTracker";

interface LoanRowProps {
  loan: Loan;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddPayment: (loanId: string, data: { date: string; amount: number }) => void;
  onEdit: (loanId: string, updates: { persona?: string; note?: string; date?: string }) => void;
  onDelete: (loanId: string) => void;
  onForgive: (loanId: string) => void;
}

const COMPLETED_STATUSES = ["Cobrado", "Pagado", "Perdonado"];

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    Pendiente: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    Cobrado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Pagado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Perdonado: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <Badge className={colorMap[status] || ""}>
      {status}
    </Badge>
  );
}

function TypeBadge({ type }: { type: "preste" | "debo" }) {
  return type === "preste" ? (
    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
      Preste
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
      Debo
    </Badge>
  );
}

export function LoanRow({
  loan,
  isExpanded,
  onToggleExpand,
  onAddPayment,
  onEdit,
  onDelete,
  onForgive,
}: LoanRowProps) {
  const isHydrated = useHydration();
  const isCompleted = COMPLETED_STATUSES.includes(loan.status);
  const remaining = loan.amount - loan.payments.reduce((sum, p) => sum + p.amount, 0);
  const symbol = currencySymbol(loan.currencyType);

  return (
    <>
      <TableRow
        className={`cursor-pointer ${isCompleted ? "opacity-60" : ""}`}
        onClick={onToggleExpand}
      >
        <TableCell className="w-8">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </TableCell>
        <TableCell className="font-medium">
          {loan.persona}
          {loan.note && (
            <span className="block text-xs text-muted-foreground truncate max-w-[200px]">
              {loan.note}
            </span>
          )}
        </TableCell>
        <TableCell>
          <TypeBadge type={loan.type} />
        </TableCell>
        <TableCell className="tabular-nums">
          {isHydrated ? `${symbol}${loan.amount.toLocaleString()}` : "---"}
        </TableCell>
        <TableCell className="tabular-nums">
          {isHydrated ? `${symbol}${remaining.toLocaleString()}` : "---"}
        </TableCell>
        <TableCell>{loan.currencyType}</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {isHydrated
            ? format(parse(loan.date, "yyyy-MM-dd", new Date()), DATE_FORMAT)
            : "---"}
        </TableCell>
        <TableCell>
          <StatusBadge status={loan.status} />
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900"
              onClick={() => {
                // For now, edit is a placeholder -- actual inline edit could be added
                // The plan spec allows pencil icon for future edit capability
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {loan.type === "preste" && loan.status === "Pendiente" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs cursor-pointer text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900"
                onClick={() => onForgive(loan.id)}
              >
                Perdonar
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
              onClick={() => onDelete(loan.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow>
          <TableCell colSpan={9} className="bg-muted/30 p-4">
            <LoanPayments loan={loan} onAddPayment={onAddPayment} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
