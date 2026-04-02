"use client";
import { useMemo } from "react";
import { format, parse, isWithinInterval } from "date-fns";
import type { MonthlyData, Transfer, TransferType } from "./useMoneyTracker";
import { type ViewMode, getFilterDateRange } from "./usePayPeriod";

export function useTransfers(
  monthlyData: MonthlyData,
  updateMonthlyData: (data: MonthlyData) => void,
  selectedYear: string,
  selectedMonth: string,
  viewMode: ViewMode = "mes",
  payDay: number = 1
) {
  // Period filtering — same pattern as useExpensesTracker
  const filteredTransfers = useMemo(() => {
    const transfers = monthlyData.transfers || [];
    const monthKey = `${selectedYear}-${selectedMonth.split("-")[1] || selectedMonth}`;
    const { start, end } = getFilterDateRange(monthKey, viewMode, payDay);

    return transfers
      .filter((t) => {
        const d = parse(t.date, "yyyy-MM-dd", new Date());
        return isWithinInterval(d, { start, end });
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [monthlyData.transfers, selectedYear, selectedMonth, viewMode, payDay]);

  const handleAddTransfer = (data: Omit<Transfer, "id" | "createdAt">) => {
    const transfer: Transfer = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    updateMonthlyData({
      ...monthlyData,
      transfers: [...(monthlyData.transfers || []), transfer],
    });
  };

  const handleUpdateTransfer = (id: string, updates: Partial<Transfer>) => {
    updateMonthlyData({
      ...monthlyData,
      transfers: (monthlyData.transfers || []).map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    });
  };

  const handleDeleteTransfer = (id: string) => {
    updateMonthlyData({
      ...monthlyData,
      transfers: (monthlyData.transfers || []).filter((t) => t.id !== id),
    });
  };

  const handleCreateAdjustment = (
    currency: "ARS" | "USD",
    realBalance: number,
    trackedBalance: number
  ) => {
    const adjustmentAmount = realBalance - trackedBalance;
    if (adjustmentAmount === 0) return; // No adjustment needed

    handleAddTransfer({
      date: format(new Date(), "yyyy-MM-dd"),
      type: currency === "ARS" ? "adjustment_ars" : "adjustment_usd",
      amount: adjustmentAmount,
      description: `Ajuste saldo ${currency}`,
    });
  };

  return {
    filteredTransfers,
    handleAddTransfer,
    handleUpdateTransfer,
    handleDeleteTransfer,
    handleCreateAdjustment,
  };
}
