"use client";

import { useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExtraIncome, CurrencyType } from "@/hooks/useMoneyTracker";
import { currencySymbol } from "@/constants/investments";
import { FormattedAmount } from "./formatted-amount";
import { FormattedDate } from "./formatted-date";
import { useHydration } from "@/hooks/useHydration";
import { cn } from "@/lib/utils";

interface IncomeTableProps {
  incomes: ExtraIncome[];
  onDeleteIncome: (id: string) => void;
  onEditIncome: (income: ExtraIncome) => void;
  onUpdateUsdRate: (incomeId: string, newRate: number) => void;
}

function InlineRateEditor({
  currentRate,
  onSave,
  onCancel,
}: {
  currentRate: number;
  onSave: (newRate: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(String(currentRate));

  const handleSave = () => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      onSave(num);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
          if (e.key === "Escape") onCancel();
        }}
        className="h-6 w-20 text-xs"
        autoFocus
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleSave}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onCancel}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default function IncomeTable({
  incomes,
  onDeleteIncome,
  onEditIncome,
  onUpdateUsdRate,
}: IncomeTableProps) {
  const isHydrated = useHydration();
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const className = "text-center";

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteIncome(deleteTarget);
      setDeleteTarget(null);
    }
  };

  if (!isHydrated) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={className}>Fecha</TableHead>
            <TableHead className={className}>Descripcion</TableHead>
            <TableHead className={className}>Monto</TableHead>
            <TableHead className={className}>Cotizacion</TableHead>
            <TableHead className={className}>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              Cargando...
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={className}>Fecha</TableHead>
          <TableHead className={className}>Descripcion</TableHead>
          <TableHead className={className}>Monto</TableHead>
          <TableHead className={className}>Cotizacion</TableHead>
          <TableHead className={className}>Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {incomes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center">
              No hay ingresos extra este mes
            </TableCell>
          </TableRow>
        ) : (
          incomes.map((income) => (
            <TableRow key={income.id}>
              <TableCell className={className}>
                <FormattedDate date={income.date} />
              </TableCell>
              <TableCell className={className}>{income.name}</TableCell>
              <TableCell className={className}>
                <span className={cn(
                  "font-medium",
                  income.currencyType === CurrencyType.USD && "text-green-600 dark:text-green-400"
                )}>
                  <FormattedAmount
                    value={income.amount}
                    currency={currencySymbol(income.currencyType || CurrencyType.ARS)}
                  />
                </span>
              </TableCell>
              <TableCell className={className}>
                {editingRateId === income.id ? (
                  <InlineRateEditor
                    currentRate={income.usdRate}
                    onSave={(newRate) => {
                      onUpdateUsdRate(income.id, newRate);
                      setEditingRateId(null);
                    }}
                    onCancel={() => setEditingRateId(null)}
                  />
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {income.usdRate > 0
                        ? `$${income.usdRate.toLocaleString()}`
                        : "-"}
                    </span>
                    {income.usdRate > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-blue-500"
                        onClick={() => setEditingRateId(income.id)}
                        title="Editar cotizacion"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell className={className}>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer text-blue-500 group/edit hover:bg-blue-500 hover:text-white"
                    onClick={() => onEditIncome(income)}
                  >
                    <Pencil className="h-4 w-4 group-hover/edit:scale-125" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="cursor-pointer text-red-500 group/delete hover:bg-red-500 hover:text-white"
                    onClick={() => setDeleteTarget(income.id)}
                  >
                    <Trash2 className="h-4 w-4 group-hover/delete:scale-125" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>

    <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar ingreso?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminara este ingreso permanentemente. Esta accion no se puede deshacer.
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
