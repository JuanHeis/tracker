"use client";

import { useState } from "react";
import { format, parse } from "date-fns";
import { Trash2, Plus, Check, Pencil, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { CurrencyInput } from "./currency-input";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DATE_FORMAT } from "@/constants/date";
import type { Investment, InvestmentPurpose } from "@/hooks/useMoneyTracker";
import { getInvestmentPurpose } from "@/hooks/useMoneyTracker";
import { currencySymbol } from "@/constants/investments";
import {
  INVESTMENT_PURPOSE_LABELS,
  INVESTMENT_PURPOSE_ORDER,
  getMovementPurpose,
} from "@/constants/investment-purpose";
import { computeBuckets } from "@/lib/investments/buckets";

interface InvestmentMovementsProps {
  investment: Investment;
  onAddMovement: (
    investmentId: string,
    movement: { date: string; type: "aporte" | "retiro"; amount: number; pendingIngreso?: boolean; purpose?: InvestmentPurpose }
  ) => void;
  onDeleteMovement: (investmentId: string, movementId: string) => void;
  onConfirmRetiro: (investmentId: string, movementId: string, receivedAmount?: number) => void;
  onEditMovement: (investmentId: string, movementId: string, updates: { amount?: number; pendingIngreso?: boolean; receivedAmount?: number; purpose?: InvestmentPurpose }) => void;
}

export function InvestmentMovements({
  investment,
  onAddMovement,
  onDeleteMovement,
  onConfirmRetiro,
  onEditMovement,
}: InvestmentMovementsProps) {
  const [showAll, setShowAll] = useState(false);
  const [movementType, setMovementType] = useState<"aporte" | "retiro">(
    "aporte"
  );
  const [markPending, setMarkPending] = useState(false);
  const [selectedPurpose, setSelectedPurpose] = useState<InvestmentPurpose>(
    getInvestmentPurpose(investment)
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [confirmingMovement, setConfirmingMovement] = useState<string | null>(null);
  const [adjustedAmount, setAdjustedAmount] = useState<number>(0);
  const [editingMovement, setEditingMovement] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editPending, setEditPending] = useState<boolean>(false);
  const [editReceivedAmount, setEditReceivedAmount] = useState<number>(0);
  const [editPurpose, setEditPurpose] = useState<InvestmentPurpose>("ahorro");
  const [showBuckets, setShowBuckets] = useState(false);

  const editingMov = editingMovement
    ? investment.movements.find((m) => m.id === editingMovement)
    : undefined;
  const editingIsRetiro = editingMov?.type === "retiro";

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteMovement(investment.id, deleteTarget);
      setDeleteTarget(null);
    }
  };

  const sortedMovements = [...investment.movements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const displayedMovements = showAll
    ? sortedMovements
    : sortedMovements.slice(0, 5);
  const hasMore = sortedMovements.length > 5;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const date = formData.get("date") as string;
    const amount = Number(formData.get("amount"));

    if (!date || !amount || amount <= 0) return;

    onAddMovement(investment.id, {
      date,
      type: movementType,
      amount,
      purpose: selectedPurpose,
      ...(movementType === "retiro" && markPending ? { pendingIngreso: true } : {}),
    });

    e.currentTarget.reset();
    setMovementType("aporte");
    setMarkPending(false);
    setSelectedPurpose(getInvestmentPurpose(investment));
  };

  return (
    <>
    <div className="space-y-3">
      {investment.status !== "Finalizada" && (
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 pb-3 border-b"
        >
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
            <CurrencyInput
              name="amount"
              required
              placeholder="Monto"
              className="h-8 w-28 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Tipo</label>
            <Select
              value={movementType}
              onValueChange={(v) =>
                setMovementType(v as "aporte" | "retiro")
              }
            >
              <SelectTrigger className="h-8 w-28 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aporte">Aporte</SelectItem>
                <SelectItem value="retiro">Retiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Propósito</label>
            <Select
              value={selectedPurpose}
              onValueChange={(v) => setSelectedPurpose(v as InvestmentPurpose)}
            >
              <SelectTrigger className="h-8 w-32 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVESTMENT_PURPOSE_ORDER.map((p) => (
                  <SelectItem key={p} value={p}>
                    {INVESTMENT_PURPOSE_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="sm" className="h-8">
            <Plus className="h-4 w-4" />
          </Button>
          {movementType === "retiro" && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none ml-1">
              <input
                type="checkbox"
                checked={markPending}
                onChange={(e) => setMarkPending(e.target.checked)}
                className="rounded border-gray-300 h-3.5 w-3.5 accent-amber-500"
              />
              Pendiente de ingreso
            </label>
          )}
        </form>
      )}

      <div
        className={
          showAll && sortedMovements.length > 5
            ? "max-h-60 overflow-y-auto"
            : ""
        }
      >
        {displayedMovements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Sin movimientos
          </p>
        ) : (
          <div className="space-y-1">
            {displayedMovements.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-20">
                    {format(
                      parse(movement.date, "yyyy-MM-dd", new Date()),
                      DATE_FORMAT
                    )}
                  </span>
                  <Badge
                    className={
                      movement.type === "aporte"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }
                  >
                    {movement.type === "aporte" ? "Aporte" : "Retiro"}
                  </Badge>
                  {movement.pendingIngreso && (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-[10px] px-1.5 py-0">
                      Pendiente
                    </Badge>
                  )}
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-[10px] px-1.5 py-0">
                    {INVESTMENT_PURPOSE_LABELS[getMovementPurpose(movement, investment)]}
                  </Badge>
                  <span className="tabular-nums font-medium">
                    {currencySymbol(investment.currencyType)}{movement.amount.toLocaleString()}
                    {movement.receivedAmount !== undefined && movement.receivedAmount !== movement.amount && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (recibido: {currencySymbol(investment.currencyType)}{movement.receivedAmount.toLocaleString()})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {!movement.isInitial && (movement.type === "retiro" || movement.type === "aporte") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900"
                      onClick={() => {
                        setEditingMovement(movement.id);
                        setEditAmount(movement.amount);
                        setEditPending(!!movement.pendingIngreso);
                        setEditReceivedAmount(movement.receivedAmount ?? movement.amount);
                        setEditPurpose(getMovementPurpose(movement, investment));
                      }}
                      title={movement.type === "retiro" ? "Editar retiro" : "Editar propósito"}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                  {movement.type === "retiro" && movement.pendingIngreso && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                      onClick={() => {
                        setConfirmingMovement(movement.id);
                        setAdjustedAmount(movement.amount);
                      }}
                      title="Confirmar ingreso"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                    onClick={() => setDeleteTarget(movement.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
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
          Ver todo ({sortedMovements.length} movimientos)
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

      {/* Buckets por propósito (D18/D19) */}
      <div className="pt-3 border-t">
        <button
          type="button"
          onClick={() => setShowBuckets((s) => !s)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {showBuckets ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Buckets por propósito (saldo aproximado)
        </button>
        {showBuckets && (() => {
          const breakdown = computeBuckets(investment);
          const sym = currencySymbol(investment.currencyType);
          const rows = breakdown.buckets.filter((b) => b.amount !== 0 || b.negative);
          return (
            <div className="mt-2 space-y-1 text-sm">
              {rows.length === 0 && (
                <p className="text-xs text-muted-foreground">Sin movimientos con propósito asignado.</p>
              )}
              {rows.map((b) => (
                <div key={b.purpose} className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    {b.negative && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    )}
                    {INVESTMENT_PURPOSE_LABELS[b.purpose]}
                  </span>
                  <span
                    className={
                      "tabular-nums " +
                      (b.negative ? "text-amber-600 dark:text-amber-400 font-medium" : "")
                    }
                    title={
                      b.negative
                        ? "Bucket negativo: retiraste más de lo aportado con este propósito. Considerá dividir el retiro en dos movimientos con propósitos distintos."
                        : undefined
                    }
                  >
                    {sym}
                    {b.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              {Math.abs(breakdown.sinAsignar) > 0.5 && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>
                    Sin asignar <span className="text-xs">(rendimientos)</span>
                  </span>
                  <span className="tabular-nums">
                    {sym}
                    {breakdown.sinAsignar.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-1 font-medium">
                <span>Total</span>
                <span className="tabular-nums">
                  {sym}
                  {breakdown.total.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>

    <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar movimiento?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminara este movimiento de la inversion. Esta accion no se puede deshacer.
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

    <AlertDialog open={!!confirmingMovement} onOpenChange={(open) => !open && setConfirmingMovement(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar ingreso del retiro</AlertDialogTitle>
          <AlertDialogDescription>
            El monto original del retiro es {currencySymbol(investment.currencyType)}
            {(() => {
              const mov = investment.movements.find(m => m.id === confirmingMovement);
              return mov ? mov.amount.toLocaleString() : "0";
            })()}.
            Si recibiste un monto diferente, ajustalo abajo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <label className="text-sm text-muted-foreground">Monto recibido</label>
          <CurrencyInput
            value={adjustedAmount}
            onValueChange={(val) => setAdjustedAmount(val)}
            className="h-8 w-full mt-1"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (confirmingMovement) {
                onConfirmRetiro(
                  investment.id,
                  confirmingMovement,
                  adjustedAmount > 0 ? adjustedAmount : undefined
                );
                setConfirmingMovement(null);
                setAdjustedAmount(0);
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Confirmar ingreso
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog open={!!editingMovement} onOpenChange={(open) => { if (!open) setEditingMovement(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingIsRetiro ? "Editar retiro" : "Editar propósito"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {editingIsRetiro && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-muted-foreground">Monto del retiro</label>
                <CurrencyInput
                  value={editAmount}
                  onValueChange={(val) => setEditAmount(val)}
                  className="h-8 w-full"
                />
              </div>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editPending}
                  onChange={(e) => setEditPending(e.target.checked)}
                  className="rounded border-gray-300 h-3.5 w-3.5 accent-amber-500"
                />
                Pendiente de ingreso
              </label>
              {!editPending && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground">Monto recibido</label>
                  <CurrencyInput
                    value={editReceivedAmount}
                    onValueChange={(val) => setEditReceivedAmount(val)}
                    className="h-8 w-full"
                  />
                </div>
              )}
            </>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Propósito</label>
            <Select value={editPurpose} onValueChange={(v) => setEditPurpose(v as InvestmentPurpose)}>
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVESTMENT_PURPOSE_ORDER.map((p) => (
                  <SelectItem key={p} value={p}>
                    {INVESTMENT_PURPOSE_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingMovement(null)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!editingMovement) return;
              const originalMov = investment.movements.find((m) => m.id === editingMovement);
              if (!originalMov) return;

              const updates: { amount?: number; pendingIngreso?: boolean; receivedAmount?: number; purpose?: InvestmentPurpose } = {};

              // Purpose applies to both aportes and retiros
              if (editPurpose !== getMovementPurpose(originalMov, investment)) {
                updates.purpose = editPurpose;
              }

              if (originalMov.type === "retiro") {
                if (editAmount !== originalMov.amount) {
                  updates.amount = editAmount;
                }

                const wasPending = !!originalMov.pendingIngreso;
                if (editPending !== wasPending) {
                  updates.pendingIngreso = editPending;
                }

                if (editPending) {
                  // When pending, clear receivedAmount
                  if (originalMov.receivedAmount !== undefined) {
                    updates.receivedAmount = undefined;
                  }
                } else {
                  // When confirmed, check if receivedAmount changed
                  const effectiveAmount = updates.amount !== undefined ? updates.amount : originalMov.amount;
                  if (editReceivedAmount !== (originalMov.receivedAmount ?? originalMov.amount)) {
                    if (editReceivedAmount !== effectiveAmount) {
                      updates.receivedAmount = editReceivedAmount;
                    } else if (originalMov.receivedAmount !== undefined) {
                      // receivedAmount equals amount now, clear it
                      updates.receivedAmount = undefined;
                    }
                  }
                }
              }

              // Only call if there are actual changes
              if (Object.keys(updates).length > 0) {
                onEditMovement(investment.id, editingMovement, updates);
              }
              setEditingMovement(null);
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
