"use client";
import { useState } from "react";
import { format, addMonths } from "date-fns";
import type { InvestmentType, CurrencyType } from "@/constants/investments";
import type { Investment, InvestmentMovement } from "@/hooks/useMoneyTracker";

// ─── Types ──────────────────────────────────────────────────────────

export interface WizardInvestment {
  name: string;
  type: InvestmentType;
  currencyType: CurrencyType;
  amount: number;
  isLiquid?: boolean;
  tna?: number;         // Plazo Fijo only
  plazoDias?: number;   // Plazo Fijo only
}

export interface WizardData {
  arsBalance: number;       // Step: ARS Balance (required, >= 0)
  usdAmount: number;        // Step: USD (optional, skippable)
  globalUsdRate: number;    // Step: USD (cotizacion)
  employmentType: "dependiente" | "independiente";  // Step: Income
  payDay: number;           // Step: Income (1-31)
  salaryAmount: number;     // Step: Income (optional, skippable)
  investments: WizardInvestment[];  // Step: Investments (optional, skippable)
}

export const INITIAL_WIZARD_DATA: WizardData = {
  arsBalance: 0,
  usdAmount: 0,
  globalUsdRate: 0,
  employmentType: "dependiente",
  payDay: 1,
  salaryAmount: 0,
  investments: [],
};

// ─── Step Validation ────────────────────────────────────────────────

export function validateArsStep(data: WizardData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (isNaN(data.arsBalance) || data.arsBalance < 0) {
    errors.arsBalance = "El saldo ARS debe ser un numero valido mayor o igual a 0";
  }
  return errors;
}

export function validateUsdStep(data: WizardData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (data.usdAmount > 0 && (!data.globalUsdRate || data.globalUsdRate <= 0)) {
    errors.globalUsdRate = "Ingresa la cotizacion del dolar para registrar tus USD";
  }
  return errors;
}

export function validateIncomeStep(data: WizardData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (data.salaryAmount > 0) {
    if (data.payDay < 1 || data.payDay > 31 || !Number.isInteger(data.payDay)) {
      errors.payDay = "El dia de cobro debe ser entre 1 y 31";
    }
  }
  return errors;
}

export function validateInvestmentsStep(data: WizardData): Record<string, string> {
  const errors: Record<string, string> = {};
  data.investments.forEach((inv, i) => {
    if (!inv.name || inv.name.trim() === "") {
      errors[`investment_${i}_name`] = "El nombre es requerido";
    }
    if (!inv.amount || inv.amount <= 0) {
      errors[`investment_${i}_amount`] = "El monto debe ser mayor a 0";
    }
    if (inv.type === "Plazo Fijo") {
      if (!inv.tna || inv.tna <= 0) {
        errors[`investment_${i}_tna`] = "La TNA debe ser mayor a 0";
      }
      if (!inv.plazoDias || inv.plazoDias <= 0) {
        errors[`investment_${i}_plazoDias`] = "El plazo debe ser mayor a 0 dias";
      }
    }
  });
  return errors;
}

// ─── Session Storage Draft Persistence ──────────────────────────────

const DRAFT_KEY = "wizardDraft";

function saveDraft(data: WizardData, currentStep: number): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step: currentStep }));
}

function loadDraft(): { data: WizardData; step: number } | null {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // Handle drafts saved before investments phase
    if (parsed?.data && !Array.isArray(parsed.data.investments)) {
      parsed.data.investments = [];
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY);
}

// ─── Atomic Commit Function ─────────────────────────────────────────

export function commitWizardData(data: WizardData): void {
  const today = format(new Date(), "yyyy-MM-dd");
  const currentMonth = format(new Date(), "yyyy-MM");
  const now = new Date().toISOString();

  // Build transfers array (ARS initial balance)
  const transfers = data.arsBalance > 0
    ? [{
        id: crypto.randomUUID(),
        date: today,
        type: "adjustment_ars" as const,
        amount: data.arsBalance,
        description: "Saldo inicial ARS (wizard)",
        createdAt: now,
      }]
    : [];

  // Build usdPurchases array (USD initial holdings)
  const usdPurchases = data.usdAmount > 0
    ? [{
        id: crypto.randomUUID(),
        date: today,
        arsAmount: 0,
        usdAmount: data.usdAmount,
        purchaseRate: 0,
        origin: "untracked" as const,
        description: "Saldo inicial USD (wizard)",
      }]
    : [];

  // Map wizard investments to full Investment objects
  const mappedInvestments: Investment[] = data.investments.map((wi) => ({
    id: crypto.randomUUID(),
    name: wi.name,
    type: wi.type,
    currencyType: wi.currencyType,
    status: "Activa" as const,
    movements: [{
      id: crypto.randomUUID(),
      date: today,
      type: "aporte" as const,
      amount: wi.amount,
      isInitial: true,
    }] as InvestmentMovement[],
    currentValue: wi.amount,
    lastUpdated: today,
    createdAt: today,
    ...(wi.isLiquid && { isLiquid: true }),
    ...(wi.tna !== undefined && { tna: wi.tna }),
    ...(wi.plazoDias !== undefined && { plazoDias: wi.plazoDias }),
    ...(wi.type === "Plazo Fijo" && { startDate: today }),
  }));

  // Build monthlyData
  const monthlyData = {
    salaries: {},
    expenses: [],
    extraIncomes: [],
    investments: mappedInvestments,
    usdPurchases,
    transfers,
    loans: [],
    salaryOverrides: {},
    aguinaldoOverrides: {},
    _migrationVersion: 8,
  };

  // Build salaryHistory — effective from NEXT month since the wizard captures
  // current state (liquid cash already includes this month's salary received)
  const nextMonth = format(addMonths(new Date(), 1), "yyyy-MM");
  const salaryEntries = data.salaryAmount > 0
    ? [{
        id: crypto.randomUUID(),
        effectiveDate: nextMonth,
        amount: data.salaryAmount,
        usdRate: data.globalUsdRate || 0,
      }]
    : [];

  // Write all 7 localStorage keys atomically
  localStorage.setItem("monthlyData", JSON.stringify(monthlyData));
  localStorage.setItem("globalUsdRate", String(data.globalUsdRate || 0));
  localStorage.setItem("salaryHistory", JSON.stringify({ entries: salaryEntries }));
  localStorage.setItem("incomeConfig", JSON.stringify({
    employmentType: data.employmentType || "dependiente",
    payDay: data.payDay || 1,
  }));
  localStorage.setItem("recurringExpenses", JSON.stringify([]));
  localStorage.setItem("budgetData", JSON.stringify({ definitions: [], snapshots: {} }));
  localStorage.setItem("lastUsedUsdRate", String(data.globalUsdRate || 0));

  // Clear draft after successful commit
  clearDraft();
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useSetupWizard() {
  const draft = typeof window !== "undefined" ? loadDraft() : null;

  const [wizardData, setWizardData] = useState<WizardData>(
    draft?.data ?? { ...INITIAL_WIZARD_DATA }
  );
  const [currentStep, setCurrentStepRaw] = useState<number>(draft?.step ?? 0);

  // Steps: 0=welcome, 1=ARS, 2=USD, 3=income, 4=investments, 5=summary
  const setCurrentStep = (step: number) => {
    setCurrentStepRaw(step);
    saveDraft(wizardData, step);
  };

  const goNext = () => {
    const nextStep = currentStep + 1;
    setCurrentStepRaw(nextStep);
    saveDraft(wizardData, nextStep);
  };

  const goBack = () => {
    const prevStep = Math.max(0, currentStep - 1);
    setCurrentStepRaw(prevStep);
    saveDraft(wizardData, prevStep);
  };

  const validateCurrentStep = (): Record<string, string> => {
    switch (currentStep) {
      case 1: return validateArsStep(wizardData);
      case 2: return validateUsdStep(wizardData);
      case 3: return validateIncomeStep(wizardData);
      case 4: return validateInvestmentsStep(wizardData);
      default: return {};
    }
  };

  const commit = () => {
    commitWizardData(wizardData);
  };

  return {
    wizardData,
    setWizardData,
    currentStep,
    setCurrentStep,
    goNext,
    goBack,
    validateCurrentStep,
    commit,
  };
}
