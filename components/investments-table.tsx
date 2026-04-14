"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Investment } from "@/hooks/useMoneyTracker";
import { currencySymbol } from "@/constants/investments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useHydration } from "@/hooks/useHydration";
import { InvestmentRow } from "@/components/investment-row";
import { DATE_FORMAT } from "@/constants/date";

interface InvestmentsTableProps {
  investments: Investment[];
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
  onAddMovement: (investmentId: string, movement: { date: string; type: "aporte" | "retiro"; amount: number; pendingIngreso?: boolean }) => void;
  onDeleteMovement: (investmentId: string, movementId: string) => void;
  onConfirmRetiro: (investmentId: string, movementId: string, receivedAmount?: number) => void;
  onUpdateValue: (investmentId: string, newValue: number) => void;
  onUpdatePFFields: (investmentId: string, fields: { tna?: number; plazoDias?: number; startDate?: string }) => void;
  onFinalize: (investmentId: string) => void;
}

export function InvestmentsTable({
  investments,
  onEdit,
  onDelete,
  onAddMovement,
  onDeleteMovement,
  onConfirmRetiro,
  onUpdateValue,
  onUpdatePFFields,
  onFinalize,
}: InvestmentsTableProps) {
  const isHydrated = useHydration();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [finalizingInvestment, setFinalizingInvestment] = useState<Investment | null>(null);

  const handleFinalizeRequest = (investmentId: string) => {
    const investment = investments.find((inv) => inv.id === investmentId);
    if (investment) {
      setFinalizingInvestment(investment);
    }
  };

  const handleConfirmFinalize = () => {
    if (finalizingInvestment) {
      onFinalize(finalizingInvestment.id);
      setFinalizingInvestment(null);
    }
  };

  if (!isHydrated) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Capital Invertido</TableHead>
            <TableHead>Valor Actual</TableHead>
            <TableHead>Ganancia/%</TableHead>
            <TableHead>Ult. Actualizacion</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={8} className="h-24 text-center">
              Cargando...
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  const activeInvestments = investments.filter((inv) => inv.status !== "Finalizada");
  const finalizedInvestments = investments.filter((inv) => inv.status === "Finalizada");

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Capital Invertido</TableHead>
            <TableHead>Valor Actual</TableHead>
            <TableHead>Ganancia/%</TableHead>
            <TableHead>Ult. Actualizacion</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeInvestments.length === 0 && finalizedInvestments.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No hay inversiones registradas
              </TableCell>
            </TableRow>
          )}
          {activeInvestments.length === 0 && finalizedInvestments.length > 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-16 text-center text-muted-foreground">
                No hay inversiones activas
              </TableCell>
            </TableRow>
          )}
          {activeInvestments.map((investment) => (
            <InvestmentRow
              key={investment.id}
              investment={investment}
              isExpanded={expandedId === investment.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === investment.id ? null : investment.id)
              }
              onAddMovement={onAddMovement}
              onDeleteMovement={onDeleteMovement}
              onConfirmRetiro={onConfirmRetiro}
              onUpdateValue={onUpdateValue}
              onUpdatePFFields={onUpdatePFFields}
              onFinalize={handleFinalizeRequest}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </TableBody>
      </Table>

      {finalizedInvestments.length > 0 && (
        <FinalizedSection
          investments={finalizedInvestments}
          onDelete={onDelete}
        />
      )}

      <Dialog
        open={finalizingInvestment !== null}
        onOpenChange={(open) => {
          if (!open) setFinalizingInvestment(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Finalizar {finalizingInvestment?.name}?
            </DialogTitle>
            <DialogDescription>
              Se creara un retiro por {finalizingInvestment ? currencySymbol(finalizingInvestment.currencyType) : "$"}{finalizingInvestment?.currentValue.toLocaleString()} y la inversion pasara a Finalizada. Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFinalizingInvestment(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmFinalize}
            >
              Confirmar Finalizacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FinalizedSection({
  investments,
  onDelete,
}: {
  investments: Investment[];
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 cursor-pointer"
      >
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        <span className="font-medium">Inversiones Finalizadas</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {investments.length}
        </Badge>
      </button>

      {expanded && (
        <div className="space-y-2">
          {investments.map((inv) => {
            const totalAportes = inv.movements
              .filter((m) => m.type === "aporte")
              .reduce((sum, m) => sum + m.amount, 0);
            const totalRetiros = inv.movements
              .filter((m) => m.type === "retiro")
              .reduce((sum, m) => sum + (m.receivedAmount ?? m.amount), 0);
            const gain = totalRetiros - totalAportes;
            const pct = totalAportes > 0 ? (gain / totalAportes) * 100 : 0;
            const sym = currencySymbol(inv.currencyType);
            const firstDate = inv.createdAt;
            const lastDate = inv.lastUpdated;
            const gainColor = gain >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400";

            return (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{inv.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {inv.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm tabular-nums">
                    <span className="text-muted-foreground">Invertiste</span>
                    <span className="font-medium">{sym}{totalAportes.toLocaleString()}</span>
                    <span className="text-muted-foreground mx-1">→</span>
                    <span className="text-muted-foreground">Retiraste</span>
                    <span className="font-medium">{sym}{totalRetiros.toLocaleString()}</span>
                    <span className={`ml-2 font-medium ${gainColor}`}>
                      {gain >= 0 ? "+" : ""}{sym}{Math.abs(gain).toLocaleString(undefined, { maximumFractionDigits: 2 })} ({pct >= 0 ? "+" : ""}{pct.toFixed(1)}%)
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(firstDate), DATE_FORMAT)} — {format(new Date(lastDate), DATE_FORMAT)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 cursor-pointer text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={() => setDeleteTarget(inv.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar inversion finalizada?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara este registro y todos sus movimientos. Esta accion no se puede deshacer.
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
    </div>
  );
}
