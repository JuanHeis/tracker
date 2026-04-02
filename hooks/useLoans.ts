"use client";
import { useMemo } from "react";
import { parse, isWithinInterval } from "date-fns";
import type { MonthlyData, Loan, LoanPayment, LoanType, LoanStatus } from "./useMoneyTracker";
import { CurrencyType } from "@/constants/investments";
import { type ViewMode, getFilterDateRange } from "./usePayPeriod";

export function useLoans(
  monthlyData: MonthlyData,
  updateMonthlyData: (data: MonthlyData) => void,
  selectedYear: string,
  selectedMonth: string,
  viewMode: ViewMode = "mes",
  payDay: number = 1
) {
  // Period filtering -- same pattern as useTransfers
  const filteredLoans = useMemo(() => {
    const loans = monthlyData.loans || [];
    const monthKey = `${selectedYear}-${selectedMonth.split("-")[1] || selectedMonth}`;
    const { start, end } = getFilterDateRange(monthKey, viewMode, payDay);

    return loans
      .filter((l) => {
        const d = parse(l.date, "yyyy-MM-dd", new Date());
        return isWithinInterval(d, { start, end });
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [monthlyData.loans, selectedYear, selectedMonth, viewMode, payDay]);

  const handleAddLoan = (data: {
    type: LoanType;
    persona: string;
    amount: number;
    currencyType: CurrencyType;
    date: string;
    note?: string;
  }) => {
    const loan: Loan = {
      ...data,
      id: crypto.randomUUID(),
      status: "Pendiente",
      payments: [],
      createdAt: new Date().toISOString(),
    };
    updateMonthlyData({
      ...monthlyData,
      loans: [...(monthlyData.loans || []), loan],
    });
  };

  const handleAddLoanPayment = (loanId: string, paymentData: { date: string; amount: number }) => {
    const loans = (monthlyData.loans || []).map((loan) => {
      if (loan.id !== loanId) return loan;

      const payment: LoanPayment = {
        id: crypto.randomUUID(),
        date: paymentData.date,
        amount: paymentData.amount,
        createdAt: new Date().toISOString(),
      };
      const updatedPayments = [...loan.payments, payment];

      // Check if remaining balance reaches 0 -- auto-transition status
      const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
      const remaining = loan.amount - totalPaid;
      let newStatus: LoanStatus = loan.status;
      if (remaining <= 0) {
        newStatus = loan.type === "preste" ? "Cobrado" : "Pagado";
      }

      return { ...loan, payments: updatedPayments, status: newStatus };
    });

    updateMonthlyData({ ...monthlyData, loans });
  };

  const handleEditLoan = (loanId: string, updates: { persona?: string; note?: string; date?: string }) => {
    // Only persona, note, and date are editable after creation
    updateMonthlyData({
      ...monthlyData,
      loans: (monthlyData.loans || []).map((loan) =>
        loan.id === loanId ? { ...loan, ...updates } : loan
      ),
    });
  };

  const handleDeleteLoan = (loanId: string) => {
    // Full deletion -- reverses all financial impact as if loan never existed
    updateMonthlyData({
      ...monthlyData,
      loans: (monthlyData.loans || []).filter((l) => l.id !== loanId),
    });
  };

  const handleForgiveLoan = (loanId: string) => {
    // Only for "preste" type loans. Writes off remaining balance.
    // Patrimonio drops (asset disappears), liquid unchanged.
    // Past payments stay in history.
    updateMonthlyData({
      ...monthlyData,
      loans: (monthlyData.loans || []).map((loan) =>
        loan.id === loanId ? { ...loan, status: "Perdonado" as LoanStatus } : loan
      ),
    });
  };

  return {
    filteredLoans,
    handleAddLoan,
    handleAddLoanPayment,
    handleEditLoan,
    handleDeleteLoan,
    handleForgiveLoan,
  };
}
