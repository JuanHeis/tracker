"use client";

import { useState } from "react";
import { Investment } from "@/hooks/useMoneyTracker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useHydration } from "@/hooks/useHydration";
import { InvestmentRow } from "@/components/investment-row";

interface InvestmentsTableProps {
  investments: Investment[];
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
  onAddMovement: (investmentId: string, movement: { date: string; type: "aporte" | "retiro"; amount: number }) => void;
  onDeleteMovement: (investmentId: string, movementId: string) => void;
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
          {investments.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No hay inversiones registradas
              </TableCell>
            </TableRow>
          )}
          {investments.map((investment) => (
            <InvestmentRow
              key={investment.id}
              investment={investment}
              isExpanded={expandedId === investment.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === investment.id ? null : investment.id)
              }
              onAddMovement={onAddMovement}
              onDeleteMovement={onDeleteMovement}
              onUpdateValue={onUpdateValue}
              onUpdatePFFields={onUpdatePFFields}
              onFinalize={handleFinalizeRequest}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </TableBody>
      </Table>

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
              Se creara un retiro por ${finalizingInvestment?.currentValue.toLocaleString()} y la inversion pasara a Finalizada. Esta accion no se puede deshacer.
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
