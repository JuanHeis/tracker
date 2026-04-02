"use client";

import { useState } from "react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { DATE_FORMAT } from "@/constants/date";
import { currencySymbol } from "@/constants/investments";
import type { Loan } from "@/hooks/useMoneyTracker";

interface LoanPaymentsProps {
  loan: Loan;
  onAddPayment: (loanId: string, data: { date: string; amount: number }) => void;
}

export function LoanPayments({ loan, onAddPayment }: LoanPaymentsProps) {
  const [showAll, setShowAll] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const remaining = loan.amount - loan.payments.reduce((sum, p) => sum + p.amount, 0);
  const isFullyPaid = remaining <= 0;
  const symbol = currencySymbol(loan.currencyType);

  const sortedPayments = [...loan.payments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const displayedPayments = showAll ? sortedPayments : sortedPayments.slice(0, 5);
  const hasMore = sortedPayments.length > 5;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const amount = Number(formData.get("amount"));

    if (!date || !amount || amount <= 0) {
      setPaymentError("Monto debe ser mayor a 0");
      return;
    }

    if (amount > remaining) {
      setPaymentError(`Monto no puede superar el restante (${symbol}${remaining.toLocaleString()})`);
      return;
    }

    setPaymentError("");
    onAddPayment(loan.id, { date, amount });
    e.currentTarget.reset();
  };

  return (
    <div className="space-y-3">
      {/* Remaining balance */}
      <div className="flex items-center justify-between text-sm pb-2 border-b">
        <span className="text-muted-foreground">
          Resta: <span className="font-medium text-foreground">{symbol}{remaining.toLocaleString()}</span>
        </span>
        <span className="text-muted-foreground">
          Original: {symbol}{loan.amount.toLocaleString()}
        </span>
      </div>

      {/* Inline add payment form */}
      {!isFullyPaid && (
        <form onSubmit={handleSubmit} className="flex items-end gap-2 pb-3 border-b">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Fecha</label>
            <Input
              type="date"
              name="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="h-8 w-36 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Monto</label>
            <Input
              type="number"
              name="amount"
              required
              min="0.01"
              step="0.01"
              max={remaining}
              placeholder={`Max ${symbol}${remaining.toLocaleString()}`}
              className={cn("h-8 w-36 text-sm", paymentError && "border-red-500")}
              onChange={() => setPaymentError("")}
            />
          </div>
          <Button type="submit" size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-1" />
            Registrar
          </Button>
        </form>
      )}

      {paymentError && (
        <p className="text-xs text-red-500">{paymentError}</p>
      )}

      {/* Payment history */}
      <div className={showAll && sortedPayments.length > 5 ? "max-h-60 overflow-y-auto" : ""}>
        {displayedPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Sin pagos registrados
          </p>
        ) : (
          <div className="space-y-1">
            {displayedPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50"
              >
                <span className="text-muted-foreground w-24">
                  {format(
                    parse(payment.date, "yyyy-MM-dd", new Date()),
                    DATE_FORMAT,
                    { locale: es }
                  )}
                </span>
                <span className="tabular-nums font-medium">
                  {symbol}{payment.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-primary hover:underline"
        >
          Ver todo ({sortedPayments.length} pagos)
        </button>
      )}
      {hasMore && showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="text-xs text-primary hover:underline"
        >
          Ver menos
        </button>
      )}
    </div>
  );
}
