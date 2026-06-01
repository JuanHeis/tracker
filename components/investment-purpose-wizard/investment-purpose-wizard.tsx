"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Investment,
  type InvestmentPurpose,
  getInvestmentPurpose,
} from "@/hooks/useMoneyTracker";
import { suggestPurpose } from "./purpose-suggestion";

interface InvestmentPurposeWizardProps {
  open: boolean;
  investments: Investment[];
  onComplete: (assignments: Record<string, InvestmentPurpose>) => void;
  onDismiss: () => void;
}

/**
 * One-shot migration modal — Phase 22 D3 + D10.
 *
 * For each investment with `purpose` undefined, suggests a default via suggestPurpose().
 * User can accept all suggestions at once, override individually, or dismiss (per D10:
 * no red de seguridad — dismissal also sets wizardCompletedAt in the parent).
 */
export function InvestmentPurposeWizard({
  open,
  investments,
  onComplete,
  onDismiss,
}: InvestmentPurposeWizardProps) {
  const initialAssignments = (): Record<string, InvestmentPurpose> => {
    const map: Record<string, InvestmentPurpose> = {};
    for (const inv of investments) {
      map[inv.id] = inv.purpose ?? suggestPurpose({ name: inv.name, type: inv.type });
    }
    return map;
  };

  const [assignments, setAssignments] = useState<Record<string, InvestmentPurpose>>(initialAssignments);

  // Re-seed when the wizard opens with a different investments set
  useEffect(() => {
    if (open) setAssignments(initialAssignments());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, investments.length]);

  const handleAcceptSuggestions = () => {
    const map: Record<string, InvestmentPurpose> = {};
    for (const inv of investments) {
      map[inv.id] = suggestPurpose({ name: inv.name, type: inv.type });
    }
    setAssignments(map);
  };

  const handleConfirm = () => onComplete(assignments);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onDismiss(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Clasificá tus inversiones</DialogTitle>
          <DialogDescription>
            Cada inversión necesita un propósito para que el Resumen del Mes calcule
            bien (ahorro/objetivo/tarjeta/especulación). Las sugerencias se basan en el
            nombre y tipo — podés ajustarlas una por una.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto space-y-2 py-2">
          {investments.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay inversiones para clasificar.</p>
          )}
          {investments.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium text-sm truncate">{inv.name}</span>
                <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0">
                  {inv.type}
                </Badge>
              </div>
              <Select
                value={assignments[inv.id] ?? getInvestmentPurpose(inv)}
                onValueChange={(val) =>
                  setAssignments((prev) => ({ ...prev, [inv.id]: val as InvestmentPurpose }))
                }
              >
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ahorro">Ahorro</SelectItem>
                  <SelectItem value="objetivo">Objetivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="especulacion">Especulación</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-row gap-2 justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={handleAcceptSuggestions}>
            Aceptar sugerencias
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleConfirm}>
              Confirmar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
