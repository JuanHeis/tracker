"use client";
import { useState } from 'react';
import { format, parse, startOfMonth, endOfMonth } from 'date-fns';
import {  CurrencyType, type Investment, type MonthlyData } from './useMoneyTracker';


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

  const handleAddInvestment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newInvestment: Investment = {
      id: crypto.randomUUID(),
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      amount: Number(formData.get("amount")),
      usdRate: Number(formData.get("usdRate")),
      currencyType: CurrencyType.ARS,
      type: formData.get("type") as Investment["type"],
      status: "Activa",
      expectedEndDate: formData.get("expectedEndDate") as string,
    };

    updateMonthlyData({
      ...monthlyData,
      investments: [...(monthlyData.investments || []), newInvestment],
    });
  };

  const filteredInvestments = (monthlyData.investments || []).filter((investment) => {
    const investmentDate = parse(investment.date, "yyyy-MM-dd", new Date());
    const monthStart = startOfMonth(
      parse(`${selectedYear}-${selectedMonth.split("-")[1]}`, "yyyy-MM", new Date())
    );
    const monthEnd = endOfMonth(monthStart);
    return investmentDate >= monthStart && investmentDate <= monthEnd;
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

  const handleUpdateInvestment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingInvestment) return;

    const formData = new FormData(e.currentTarget);
    const updatedInvestment = {
      ...editingInvestment,
      date: formData.get("date") as string,
      name: formData.get("name") as string,
      amount: Number(formData.get("amount")),
      usdRate: Number(formData.get("usdRate")),
      type: formData.get("type") as Investment["type"],
      expectedEndDate: formData.get("expectedEndDate") as string,
    };

    updateMonthlyData({
      ...monthlyData,
      investments: (monthlyData.investments || []).map((investment) =>
        investment.id === editingInvestment.id ? updatedInvestment : investment
      ),
    });

    setOpenInvestment(false);
    setEditingInvestment(null);
    e.currentTarget.reset();
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
  };
} 