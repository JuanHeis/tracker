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

  const handleAddMovement = (investmentId: string, movement: { date: string; type: "aporte" | "retiro"; amount: number }) => {
    const newMovement: InvestmentMovement = {
      id: crypto.randomUUID(),
      date: movement.date,
      type: movement.type,
      amount: movement.amount,
    };
    updateInvestment(investmentId, (inv) => {
      const valueAdjustment = movement.type === "aporte" ? movement.amount : -movement.amount;
      return {
        ...inv,
        movements: [...inv.movements, newMovement],
        currentValue: inv.type === "Plazo Fijo" ? inv.currentValue : inv.currentValue + valueAdjustment,
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

  const handleUpdateValue = (investmentId: string, newValue: number) => {
    updateInvestment(investmentId, (inv) => ({
      ...inv,
      currentValue: newValue,
      lastUpdated: format(new Date(), "yyyy-MM-dd"),
    }));
  };

  const handleFinalizeInvestment = (investmentId: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    updateInvestment(investmentId, (inv) => ({
      ...inv,
      status: "Finalizada" as const,
      movements: [...inv.movements, {
        id: crypto.randomUUID(),
        date: today,
        type: "retiro" as const,
        amount: inv.currentValue,
      }],
      currentValue: 0,
      lastUpdated: today,
    }));
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
    handleUpdateValue,
    handleFinalizeInvestment,
    handleUpdatePFFields,
  };
}
