"use client";

import { useState } from "react";
import { format, parse } from "date-fns";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DATE_FORMAT } from "@/constants/date";
import type { Investment } from "@/hooks/useMoneyTracker";
import { currencySymbol } from "@/constants/investments";

interface InvestmentMovementsProps {
  investment: Investment;
  onAddMovement: (
    investmentId: string,
    movement: { date: string; type: "aporte" | "retiro"; amount: number }
  ) => void;
  onDeleteMovement: (investmentId: string, movementId: string) => void;
}

export function InvestmentMovements({
  investment,
  onAddMovement,
  onDeleteMovement,
}: InvestmentMovementsProps) {
  const [showAll, setShowAll] = useState(false);
  const [movementType, setMovementType] = useState<"aporte" | "retiro">(
    "aporte"
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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
    });

    e.currentTarget.reset();
    setMovementType("aporte");
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
            <Input
              type="number"
              name="amount"
              required
              min="0.01"
              step="0.01"
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
          <Button type="submit" size="sm" className="h-8">
            <Plus className="h-4 w-4" />
          </Button>
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
                  <span className="tabular-nums font-medium">
                    {currencySymbol(investment.currencyType)}{movement.amount.toLocaleString()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={() => setDeleteTarget(movement.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
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
    </>
  );
}
