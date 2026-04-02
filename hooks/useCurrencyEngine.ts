"use client";
import { useState, useEffect } from "react";
import type { MonthlyData, UsdPurchase } from "./useMoneyTracker";

export function useCurrencyEngine(
  monthlyData: MonthlyData,
  updateMonthlyData: (data: MonthlyData) => void
) {
  // globalUsdRate from localStorage (separate key, not per-month)
  const [globalUsdRate, setGlobalUsdRateRaw] = useState<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem("globalUsdRate");
    if (stored) setGlobalUsdRateRaw(Number(stored));
  }, []);

  const setGlobalUsdRate = (rate: number) => {
    if (rate <= 0) return; // MON-08 validation
    setGlobalUsdRateRaw(rate);
    localStorage.setItem("globalUsdRate", String(rate));
  };

  const handleBuyUsd = (arsAmount: number, usdAmount: number, date: string) => {
    if (arsAmount <= 0 || usdAmount <= 0) return; // MON-08
    const purchase: UsdPurchase = {
      id: crypto.randomUUID(),
      date,
      arsAmount,
      usdAmount,
      purchaseRate: Math.round((arsAmount / usdAmount) * 100) / 100,
      origin: "tracked",
    };
    updateMonthlyData({
      ...monthlyData,
      usdPurchases: [...(monthlyData.usdPurchases || []), purchase],
    });
  };

  const handleRegisterUntrackedUsd = (usdAmount: number, date: string, description: string) => {
    if (usdAmount <= 0 || !description.trim()) return; // MON-08
    const purchase: UsdPurchase = {
      id: crypto.randomUUID(),
      date,
      arsAmount: 0,
      usdAmount,
      purchaseRate: 0,
      origin: "untracked",
      description,
    };
    updateMonthlyData({
      ...monthlyData,
      usdPurchases: [...(monthlyData.usdPurchases || []), purchase],
    });
  };

  const handleDeleteUsdPurchase = (purchaseId: string) => {
    updateMonthlyData({
      ...monthlyData,
      usdPurchases: (monthlyData.usdPurchases || []).filter(p => p.id !== purchaseId),
    });
  };

  const calculateExchangeGainLoss = () => {
    if (globalUsdRate <= 0) return { totalGainLoss: 0, perPurchase: [] };
    const trackedPurchases = (monthlyData.usdPurchases || []).filter(p => p.origin === "tracked");
    let totalGainLoss = 0;
    const perPurchase = trackedPurchases.map(purchase => {
      const gainLoss = Math.round((globalUsdRate - purchase.purchaseRate) * purchase.usdAmount * 100) / 100;
      totalGainLoss += gainLoss;
      return { id: purchase.id, gainLoss };
    });
    totalGainLoss = Math.round(totalGainLoss * 100) / 100;
    return { totalGainLoss, perPurchase };
  };

  return {
    globalUsdRate,
    setGlobalUsdRate,
    handleBuyUsd,
    handleRegisterUntrackedUsd,
    handleDeleteUsdPurchase,
    calculateExchangeGainLoss,
  };
}
