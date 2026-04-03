"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/currency-input";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Transfer, TransferType } from "@/hooks/useMoneyTracker";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTransfer: (data: Omit<Transfer, "id" | "createdAt">) => void;
  defaultDate: string;
  globalUsdRate: number;
}

const TRANSFER_TYPE_OPTIONS: { value: TransferType; label: string }[] = [
  { value: "currency_ars_to_usd", label: "Transferencia ARS \u2192 USD" },
  { value: "currency_usd_to_ars", label: "Transferencia USD \u2192 ARS" },
  { value: "cash_out", label: "Retiro a efectivo" },
  { value: "cash_in", label: "Deposito desde efectivo" },
];

export function TransferDialog({
  open,
  onOpenChange,
  onAddTransfer,
  defaultDate,
  globalUsdRate,
}: TransferDialogProps) {
  const [transferType, setTransferType] = useState<TransferType>("currency_ars_to_usd");
  const [arsAmount, setArsAmount] = useState("");
  const [usdAmount, setUsdAmount] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isCurrencyType =
    transferType === "currency_ars_to_usd" || transferType === "currency_usd_to_ars";

  const effectiveRate =
    parseFloat(arsAmount) > 0 && parseFloat(usdAmount) > 0
      ? (parseFloat(arsAmount) / parseFloat(usdAmount)).toFixed(2)
      : null;

  const handleArsChange = (n: number) => {
    setArsAmount(String(n));
    setErrors((prev) => { const next = { ...prev }; delete next.arsAmount; return next; });
    if (!isNaN(n) && n > 0 && globalUsdRate > 0) {
      setUsdAmount((n / globalUsdRate).toFixed(2));
    }
  };

  const handleUsdChange = (n: number) => {
    setUsdAmount(String(n));
    setErrors((prev) => { const next = { ...prev }; delete next.usdAmount; return next; });
    if (!isNaN(n) && n > 0 && globalUsdRate > 0) {
      setArsAmount((n * globalUsdRate).toFixed(2));
    }
  };

  const resetForm = () => {
    setTransferType("currency_ars_to_usd");
    setArsAmount("");
    setUsdAmount("");
    setAmount("");
    setCurrency("ARS");
    setNote("");
    setDate(defaultDate);
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

    if (isCurrencyType) {
      const ars = parseFloat(arsAmount);
      const usd = parseFloat(usdAmount);
      if (isNaN(ars) || ars <= 0) newErrors.arsAmount = "Debe ser mayor a 0";
      if (isNaN(usd) || usd <= 0) newErrors.usdAmount = "Debe ser mayor a 0";
    } else {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) newErrors.amount = "Debe ser mayor a 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isCurrencyType) {
      const ars = parseFloat(arsAmount);
      const usd = parseFloat(usdAmount);
      onAddTransfer({
        date,
        type: transferType,
        arsAmount: ars,
        usdAmount: usd,
        exchangeRate: Math.round((ars / usd) * 100) / 100,
      });
    } else if (transferType === "cash_out") {
      onAddTransfer({
        date,
        type: transferType,
        amount: parseFloat(amount),
        currency,
      });
    } else if (transferType === "cash_in") {
      onAddTransfer({
        date,
        type: transferType,
        amount: parseFloat(amount),
        currency,
        ...(note.trim() ? { description: note.trim() } : {}),
      });
    }

    resetForm();
    onOpenChange(false);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Nuevo movimiento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" key={`transfer-${open}`}>
          <Select
            value={transferType}
            onValueChange={(v) => {
              setTransferType(v as TransferType);
              setErrors({});
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de movimiento" />
            </SelectTrigger>
            <SelectContent>
              {TRANSFER_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isCurrencyType && (
            <>
              <div>
                <CurrencyInput
                  placeholder="Monto en ARS"
                  value={parseFloat(arsAmount) || ""}
                  onValueChange={handleArsChange}
                  className={cn(errors.arsAmount && "border-red-500")}
                />
                {errors.arsAmount && (
                  <p className="mt-1 text-xs text-red-500">{errors.arsAmount}</p>
                )}
              </div>
              <div>
                <CurrencyInput
                  placeholder="Monto en USD"
                  value={parseFloat(usdAmount) || ""}
                  onValueChange={handleUsdChange}
                  className={cn(errors.usdAmount && "border-red-500")}
                />
                {errors.usdAmount && (
                  <p className="mt-1 text-xs text-red-500">{errors.usdAmount}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Cotizacion efectiva: {effectiveRate ? `$${effectiveRate}` : "---"}
              </p>
            </>
          )}

          {!isCurrencyType && (
            <>
              <div>
                <CurrencyInput
                  placeholder="Monto"
                  value={parseFloat(amount) || ""}
                  onValueChange={(n) => {
                    setAmount(String(n));
                    setErrors((prev) => { const next = { ...prev }; delete next.amount; return next; });
                  }}
                  className={cn(errors.amount && "border-red-500")}
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={currency === "ARS" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency("ARS")}
                >
                  ARS
                </Button>
                <Button
                  type="button"
                  variant={currency === "USD" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency("USD")}
                >
                  USD
                </Button>
              </div>
              {transferType === "cash_in" && (
                <Input
                  type="text"
                  placeholder="Origen del efectivo"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              )}
            </>
          )}

          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Button type="submit" disabled={hasErrors}>
            Agregar movimiento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
