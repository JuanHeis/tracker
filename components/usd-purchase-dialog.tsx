"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UsdPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuyUsd: (arsAmount: number, usdAmount: number, date: string) => void;
  onRegisterUntracked: (usdAmount: number, date: string, description: string) => void;
  defaultDate: string;
}

export function UsdPurchaseDialog({
  open,
  onOpenChange,
  onBuyUsd,
  onRegisterUntracked,
  defaultDate,
}: UsdPurchaseDialogProps) {
  const [mode, setMode] = useState<"buy" | "register">("buy");
  const [arsAmount, setArsAmount] = useState("");
  const [usdAmount, setUsdAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const effectiveRate =
    parseFloat(arsAmount) > 0 && parseFloat(usdAmount) > 0
      ? (parseFloat(arsAmount) / parseFloat(usdAmount)).toFixed(2)
      : null;

  const resetForm = () => {
    setArsAmount("");
    setUsdAmount("");
    setErrors({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleBuySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ars = parseFloat(formData.get("arsAmount") as string);
    const usd = parseFloat(formData.get("usdAmount") as string);
    const date = formData.get("date") as string;

    const newErrors: Record<string, string> = {};
    if (isNaN(ars) || ars <= 0) newErrors.arsAmount = "Debe ser mayor a 0";
    if (isNaN(usd) || usd <= 0) newErrors.usdAmount = "Debe ser mayor a 0";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onBuyUsd(ars, usd, date);
    resetForm();
    onOpenChange(false);
  };

  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const usd = parseFloat(formData.get("usdAmount") as string);
    const date = formData.get("date") as string;
    const description = (formData.get("description") as string).trim();

    const newErrors: Record<string, string> = {};
    if (isNaN(usd) || usd <= 0) newErrors.usdAmount = "Debe ser mayor a 0";
    if (!description) newErrors.description = "Requerido";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onRegisterUntracked(usd, date, description);
    resetForm();
    onOpenChange(false);
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "buy" ? "Comprar USD" : "Registrar USD no trackeado"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "buy" ? "default" : "outline"}
            size="sm"
            onClick={() => { setMode("buy"); setErrors({}); }}
            type="button"
          >
            Comprar USD
          </Button>
          <Button
            variant={mode === "register" ? "default" : "outline"}
            size="sm"
            onClick={() => { setMode("register"); setErrors({}); }}
            type="button"
          >
            Registrar USD no trackeado
          </Button>
        </div>

        {mode === "buy" ? (
          <form onSubmit={handleBuySubmit} className="space-y-4" key={`buy-${open}`}>
            <div>
              <Input
                type="number"
                placeholder="Monto en ARS"
                name="arsAmount"
                step="0.01"
                min="0.01"
                value={arsAmount}
                onChange={(e) => {
                  setArsAmount(e.target.value);
                  setErrors((prev) => { const next = { ...prev }; delete next.arsAmount; return next; });
                }}
                className={cn(errors.arsAmount && "border-red-500")}
                required
              />
              {errors.arsAmount && (
                <p className="mt-1 text-xs text-red-500">{errors.arsAmount}</p>
              )}
            </div>
            <div>
              <Input
                type="number"
                placeholder="Monto en USD"
                name="usdAmount"
                step="0.01"
                min="0.01"
                value={usdAmount}
                onChange={(e) => {
                  setUsdAmount(e.target.value);
                  setErrors((prev) => { const next = { ...prev }; delete next.usdAmount; return next; });
                }}
                className={cn(errors.usdAmount && "border-red-500")}
                required
              />
              {errors.usdAmount && (
                <p className="mt-1 text-xs text-red-500">{errors.usdAmount}</p>
              )}
            </div>
            {effectiveRate && (
              <p className="text-sm text-muted-foreground">
                Cotizacion efectiva: ${effectiveRate}
              </p>
            )}
            <Input
              type="date"
              name="date"
              defaultValue={defaultDate}
              required
            />
            <Button type="submit" disabled={hasErrors}>
              Comprar
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4" key={`register-${open}`}>
            <div>
              <Input
                type="number"
                placeholder="Monto en USD"
                name="usdAmount"
                step="0.01"
                min="0.01"
                className={cn(errors.usdAmount && "border-red-500")}
                required
              />
              {errors.usdAmount && (
                <p className="mt-1 text-xs text-red-500">{errors.usdAmount}</p>
              )}
            </div>
            <div>
              <Input
                placeholder="Origen / Descripcion"
                name="description"
                type="text"
                className={cn(errors.description && "border-red-500")}
                required
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-500">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Ej: Ahorro en efectivo, regalo, etc.
              </p>
            </div>
            <Input
              type="date"
              name="date"
              defaultValue={defaultDate}
              required
            />
            <p className="text-sm text-muted-foreground">
              Estos dolares se suman a tu patrimonio. No restan de tu saldo en pesos.
            </p>
            <Button type="submit" disabled={hasErrors}>
              Registrar
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
