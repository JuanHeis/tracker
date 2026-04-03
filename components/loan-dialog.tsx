"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/currency-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LoanType } from "@/hooks/useMoneyTracker";
import { CurrencyType } from "@/constants/investments";

interface LoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLoan: (data: {
    type: LoanType;
    persona: string;
    amount: number;
    currencyType: CurrencyType;
    date: string;
    note?: string;
  }) => void;
  defaultDate: string;
}

export function LoanDialog({
  open,
  onOpenChange,
  onAddLoan,
  defaultDate,
}: LoanDialogProps) {
  const [loanType, setLoanType] = useState<LoanType>("preste");
  const [persona, setPersona] = useState("");
  const [amount, setAmount] = useState("");
  const [currencyType, setCurrencyType] = useState<CurrencyType>(CurrencyType.ARS);
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isPreste = loanType === "preste";

  const resetForm = () => {
    setLoanType("preste");
    setPersona("");
    setAmount("");
    setCurrencyType(CurrencyType.ARS);
    setDate(defaultDate);
    setNote("");
    setErrors({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    const trimmedPersona = persona.trim();
    const parsedAmount = parseFloat(amount);

    if (!trimmedPersona) {
      newErrors.persona = "Persona es requerida";
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = "Debe ser mayor a 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onAddLoan({
      type: loanType,
      persona: trimmedPersona,
      amount: parsedAmount,
      currencyType,
      date,
      ...(note.trim() ? { note: note.trim() } : {}),
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isPreste ? "Registrar prestamo" : "Registrar deuda"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" key={`loan-${open}`}>
          {/* Preste/Debo toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={isPreste ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex-1",
                isPreste && "bg-green-600 hover:bg-green-700 text-white"
              )}
              onClick={() => setLoanType("preste")}
            >
              Preste
            </Button>
            <Button
              type="button"
              variant={!isPreste ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex-1",
                !isPreste && "bg-red-600 hover:bg-red-700 text-white"
              )}
              onClick={() => setLoanType("debo")}
            >
              Debo
            </Button>
          </div>

          {/* Persona */}
          <div className="space-y-1">
            <label htmlFor="loan-persona" className="text-sm font-medium">Persona</label>
            <Input
              id="loan-persona"
              type="text"
              placeholder="Nombre de la persona"
              value={persona}
              onChange={(e) => {
                setPersona(e.target.value);
                setErrors((prev) => { const next = { ...prev }; delete next.persona; return next; });
              }}
              className={cn(errors.persona && "border-red-500")}
            />
            {errors.persona && (
              <p className="text-xs text-red-500">{errors.persona}</p>
            )}
          </div>

          {/* Monto */}
          <div className="space-y-1">
            <label htmlFor="loan-amount" className="text-sm font-medium">Monto</label>
            <CurrencyInput
              id="loan-amount"
              placeholder="Monto"
              value={parseFloat(amount) || ""}
              onValueChange={(n) => {
                setAmount(String(n));
                setErrors((prev) => { const next = { ...prev }; delete next.amount; return next; });
              }}
              className={cn(errors.amount && "border-red-500")}
            />
            {errors.amount && (
              <p className="text-xs text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* Currency toggle */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Moneda</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={currencyType === CurrencyType.ARS ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrencyType(CurrencyType.ARS)}
              >
                ARS
              </Button>
              <Button
                type="button"
                variant={currencyType === CurrencyType.USD ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrencyType(CurrencyType.USD)}
              >
                USD
              </Button>
            </div>
          </div>

          {/* Fecha */}
          <div className="space-y-1">
            <label htmlFor="loan-date" className="text-sm font-medium">Fecha</label>
            <Input
              id="loan-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Nota */}
          <div className="space-y-1">
            <label htmlFor="loan-note" className="text-sm font-medium">Nota (opcional)</label>
            <textarea
              id="loan-note"
              placeholder="Motivo del prestamo..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <Button type="submit" className="w-full">
            {isPreste ? "Registrar prestamo" : "Registrar deuda"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
