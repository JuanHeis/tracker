"use client";
import { useState } from 'react';
import { format } from 'date-fns';
import { type Investment, type InvestmentMovement, type MonthlyData } from './useMoneyTracker';
import { CurrencyType, type InvestmentType } from '@/constants/investments';


export function useInvestmentsTracker(
  monthlyData: MonthlyData,
  updateMonthlyData: (data: MonthlyData) => void,
  selectedYear: string,
  selectedMonth: string
) {
  const [openInvestment, setOpenInvestment] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [defaultInvestmentDate, setDefaultInvestmentDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  // Helper to update a single investment in monthlyData
  const updateInvestment = (investmentId: string, updater: (inv: Investment) => Investment) => {
    updateMonthlyData({
      ...monthlyData,
      investments: (monthlyData.investments || []).map((inv) =>
        inv.id === investmentId ? updater(inv) : inv
      ),
    });
  };

  const handleAddInvestment = (investmentData: {
    name: string;
    type: InvestmentType;
    currencyType: CurrencyType;
    initialAmount: number;
    date: string;
    tna?: number;
    plazoDias?: number;
    isLiquid?: boolean;
    isInitial?: boolean;
  }) => {
    const now = investmentData.date;
    const newInvestment: Investment = {
      id: crypto.randomUUID(),
      name: investmentData.name,
      type: investmentData.type,
      currencyType: investmentData.currencyType,
      status: "Activa",
      movements: [{
        id: crypto.randomUUID(),
        date: now,
        type: "aporte",
        amount: investmentData.initialAmount,
        ...(investmentData.isInitial && { isInitial: true }),
      }],
      currentValue: investmentData.initialAmount,
      lastUpdated: now,
      createdAt: now,
      ...(investmentData.isLiquid && { isLiquid: true }),
      ...(investmentData.tna !== undefined && { tna: investmentData.tna }),
      ...(investmentData.plazoDias !== undefined && { plazoDias: investmentData.plazoDias }),
      ...(investmentData.type === "Plazo Fijo" && { startDate: now }),
    };

    updateMonthlyData({
      ...monthlyData,
      investments: [...(monthlyData.investments || []), newInvestment],
    });
  };

  const handleAddMovement = (investmentId: string, movement: { date: string; type: "aporte" | "retiro"; amount: number; pendingIngreso?: boolean }) => {
    const newMovement: InvestmentMovement = {
      id: crypto.randomUUID(),
      date: movement.date,
      type: movement.type,
      amount: movement.amount,
      ...(movement.pendingIngreso && { pendingIngreso: true }),
    };
    updateInvestment(investmentId, (inv) => {
      const valueAdjustment = movement.type === "aporte" ? movement.amount : -movement.amount;
      // Don't adjust currentValue for pending retiros — money hasn't left the investment yet
      const skipValueAdjust = movement.pendingIngreso && movement.type === "retiro";
      return {
        ...inv,
        movements: [...inv.movements, newMovement],
        currentValue: inv.type === "Plazo Fijo" || skipValueAdjust
          ? inv.currentValue
          : inv.currentValue + valueAdjustment,
        lastUpdated: format(new Date(), "yyyy-MM-dd"),
      };
    });
  };

  const handleDeleteMovement = (investmentId: string, movementId: string) => {
    updateInvestment(investmentId, (inv) => ({
      ...inv,
      movements: inv.movements.filter((m) => m.id !== movementId),
      lastUpdated: format(new Date(), "yyyy-MM-dd"),
    }));
  };

  const handleConfirmRetiro = (
    investmentId: string,
    movementId: string,
    receivedAmount?: number
  ) => {
    updateInvestment(investmentId, (inv) => {
      const mov = inv.movements.find((m) => m.id === movementId);
      // Now apply the currentValue reduction that was deferred at creation
      const valueReduction = mov ? mov.amount : 0;
      return {
        ...inv,
        movements: inv.movements.map((m) =>
          m.id === movementId
            ? {
                ...m,
                pendingIngreso: undefined,
                ...(receivedAmount !== undefined && receivedAmount !== m.amount
                  ? { receivedAmount }
                  : {}),
              }
            : m
        ),
        currentValue: inv.type === "Plazo Fijo"
          ? inv.currentValue
          : inv.currentValue - valueReduction,
        lastUpdated: format(new Date(), "yyyy-MM-dd"),
      };
    });
  };

  const handleEditMovement = (
    investmentId: string,
    movementId: string,
    updates: { amount?: number; pendingIngreso?: boolean; receivedAmount?: number }
  ) => {
    updateInvestment(investmentId, (inv) => {
      const mov = inv.movements.find((m) => m.id === movementId);
      if (!mov || mov.type !== "retiro") return inv;

      // Validate amount if provided
      if (updates.amount !== undefined && updates.amount <= 0) return inv;

      const wasPending = !!mov.pendingIngreso;
      const willBePending = updates.pendingIngreso !== undefined ? updates.pendingIngreso : wasPending;
      const oldAmount = mov.amount;
      const newAmount = updates.amount !== undefined ? updates.amount : oldAmount;

      // Calculate currentValue adjustment (skip for Plazo Fijo)
      let valueAdjustment = 0;
      if (inv.type !== "Plazo Fijo") {
        if (wasPending && !willBePending) {
          // Toggling from pending to confirmed: reduce currentValue by new amount
          valueAdjustment = -newAmount;
        } else if (!wasPending && willBePending) {
          // Toggling from confirmed to pending: restore currentValue by old amount
          valueAdjustment = oldAmount;
        } else if (!wasPending && !willBePending && updates.amount !== undefined) {
          // Both confirmed, amount changed: adjust by difference (old - new)
          valueAdjustment = oldAmount - newAmount;
        }
        // If both pending, no value adjustment needed
      }

      // Build updated movement
      const updatedMovement: typeof mov = {
        ...mov,
        ...(updates.amount !== undefined && { amount: updates.amount }),
        ...(updates.pendingIngreso !== undefined && {
          pendingIngreso: updates.pendingIngreso || undefined,
        }),
      };

      // Handle receivedAmount
      if (willBePending) {
        // Clear receivedAmount when toggling to pending
        delete updatedMovement.receivedAmount;
      } else if (updates.receivedAmount !== undefined) {
        if (updates.receivedAmount !== updatedMovement.amount) {
          updatedMovement.receivedAmount = updates.receivedAmount;
        } else {
          delete updatedMovement.receivedAmount;
        }
      }

      return {
        ...inv,
        movements: inv.movements.map((m) =>
          m.id === movementId ? updatedMovement : m
        ),
        currentValue: inv.currentValue + valueAdjustment,
        lastUpdated: format(new Date(), "yyyy-MM-dd"),
      };
    });
  };

  const handleUpdateValue = (investmentId: string, newValue: number) => {
    updateInvestment(investmentId, (inv) => ({
      ...inv,
      currentValue: newValue,
      lastUpdated: format(new Date(), "yyyy-MM-dd"),
    }));
  };

  const handleFinalizeInvestment = (investmentId: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    updateInvestment(investmentId, (inv) => {
      // Only add a retiro movement if there's remaining value to withdraw
      const newMovements = inv.currentValue > 0
        ? [...inv.movements, {
            id: crypto.randomUUID(),
            date: today,
            type: "retiro" as const,
            amount: inv.currentValue,
          }]
        : inv.movements;
      return {
        ...inv,
        status: "Finalizada" as const,
        movements: newMovements,
        currentValue: 0,
        lastUpdated: today,
      };
    });
  };

  const handleUpdatePFFields = (investmentId: string, fields: { tna?: number; plazoDias?: number; startDate?: string }) => {
    updateInvestment(investmentId, (inv) => {
      if (inv.type !== "Plazo Fijo") return inv;
      return {
        ...inv,
        ...(fields.tna !== undefined && { tna: fields.tna }),
        ...(fields.plazoDias !== undefined && { plazoDias: fields.plazoDias }),
        ...(fields.startDate !== undefined && { startDate: fields.startDate }),
        lastUpdated: format(new Date(), "yyyy-MM-dd"),
      };
    });
  };

  // Return ALL investments, sorted: active first (by createdAt desc), then finalized (by createdAt desc)
  const filteredInvestments = [...(monthlyData.investments || [])].sort((a, b) => {
    if (a.status === "Activa" && b.status !== "Activa") return -1;
    if (a.status !== "Activa" && b.status === "Activa") return 1;
    // Within same status, sort by createdAt descending
    return b.createdAt.localeCompare(a.createdAt);
  });

  const handleOpenInvestmentModal = () => {
    setDefaultInvestmentDate(format(new Date(), "yyyy-MM-dd"));
    setEditingInvestment(null);
    setOpenInvestment(true);
  };

  const handleCloseInvestmentModal = () => {
    setOpenInvestment(false);
    setEditingInvestment(null);
  };

  const handleEditInvestment = (investmentToEdit: Investment) => {
    setEditingInvestment(investmentToEdit);
    setOpenInvestment(true);
  };

  const handleDeleteInvestment = (investmentId: string) => {
    updateMonthlyData({
      ...monthlyData,
      investments: (monthlyData.investments || []).filter(
        (investment) => investment.id !== investmentId
      ),
    });
  };

  const handleUpdateInvestment = (investmentId: string, updates: { name?: string; tna?: number; plazoDias?: number; isLiquid?: boolean }) => {
    updateInvestment(investmentId, (inv) => ({
      ...inv,
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.tna !== undefined && { tna: updates.tna }),
      ...(updates.plazoDias !== undefined && { plazoDias: updates.plazoDias }),
      isLiquid: updates.isLiquid ?? inv.isLiquid ?? false,
      lastUpdated: format(new Date(), "yyyy-MM-dd"),
    }));
    setOpenInvestment(false);
    setEditingInvestment(null);
  };

  return {
    openInvestment,
    setOpenInvestment,
    editingInvestment,
    defaultInvestmentDate,
    filteredInvestments,
    handleAddInvestment,
    handleOpenInvestmentModal,
    handleCloseInvestmentModal,
    handleEditInvestment,
    handleDeleteInvestment,
    handleUpdateInvestment,
    // New movement and value operations
    handleAddMovement,
    handleDeleteMovement,
    handleConfirmRetiro,
    handleUpdateValue,
    handleFinalizeInvestment,
    handleUpdatePFFields,
    handleEditMovement,
  };
}
