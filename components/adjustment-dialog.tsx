"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormattedAmount } from "./formatted-amount";

interface AdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAdjustment: (currency: "ARS" | "USD", realBalance: number, trackedBalance: number) => void;
  arsBalance: number;
  usdBalance: number;
}

export function AdjustmentDialog({
  open,
  onOpenChange,
  onCreateAdjustment,
  arsBalance,
  usdBalance,
}: AdjustmentDialogProps) {
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [realBalance, setRealBalance] = useState<string>("");

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep("input");
      setRealBalance("");
      setCurrency("ARS");
    }
    onOpenChange(isOpen);
  };

  const trackedBalance = currency === "ARS" ? arsBalance : usdBalance;
  const realBalanceNum = parseFloat(realBalance);
  const isValidInput = realBalance !== "" && !isNaN(realBalanceNum);
  const adjustmentAmount = isValidInput ? realBalanceNum - trackedBalance : 0;
  const isZeroDiff = isValidInput && adjustmentAmount === 0;
  const currencyPrefix = currency === "ARS" ? "$" : "US$";

  const handleConfirm = () => {
    if (isValidInput && adjustmentAmount !== 0) {
      onCreateAdjustment(currency, realBalanceNum, trackedBalance);
      handleClose(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {step === "input" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Ajustar saldo real
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Currency toggle */}
              <div className="flex items-center gap-1">
                <Button
                  variant={currency === "ARS" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setCurrency("ARS")}
                >
                  ARS
                </Button>
                <Button
                  variant={currency === "USD" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setCurrency("USD")}
                >
                  USD
                </Button>
              </div>

              {/* Current tracked balance display */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Saldo segun la app:</span>
                <FormattedAmount
                  value={trackedBalance}
                  currency={currencyPrefix}
                  className="font-medium"
                />
              </div>

              {/* Real balance input */}
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Tu saldo real:</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{currencyPrefix}</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={realBalance}
                    onChange={(e) => setRealBalance(e.target.value)}
                    placeholder="0"
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && isValidInput) {
                        e.preventDefault();
                        setStep("confirm");
                      }
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => handleClose(false)}>
                  Cancelar
                </Button>
                <Button
                  disabled={!isValidInput}
                  onClick={() => setStep("confirm")}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirmar ajuste</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Math display */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Saldo segun app:</span>
                  <FormattedAmount
                    value={trackedBalance}
                    currency={currencyPrefix}
                    className="font-medium"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Saldo real:</span>
                  <FormattedAmount
                    value={realBalanceNum}
                    currency={currencyPrefix}
                    className="font-medium"
                  />
                </div>
                <hr className="my-2 border-border" />
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Ajuste:</span>
                  {isZeroDiff ? (
                    <span className="text-muted-foreground">No se necesita ajuste</span>
                  ) : (
                    <span
                      className={`font-bold ${
                        adjustmentAmount > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {adjustmentAmount > 0 ? "+" : ""}
                      <FormattedAmount
                        value={adjustmentAmount}
                        currency={currencyPrefix}
                      />
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setStep("input")}>
                  Volver
                </Button>
                <Button
                  disabled={isZeroDiff}
                  onClick={handleConfirm}
                >
                  Confirmar ajuste
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
