"use client";
import { useState } from "react";
import { format } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────────

export interface WizardData {
  arsBalance: number;       // Step: ARS Balance (required, >= 0)
  usdAmount: number;        // Step: USD (optional, skippable)
  globalUsdRate: number;    // Step: USD (cotizacion)
  employmentType: "dependiente" | "independiente";  // Step: Income
  payDay: number;           // Step: Income (1-31)
  salaryAmount: number;     // Step: Income (optional, skippable)
}

export const INITIAL_WIZARD_DATA: WizardData = {
  arsBalance: 0,
  usdAmount: 0,
  globalUsdRate: 0,
  employmentType: "dependiente",
  payDay: 1,
  salaryAmount: 0,
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

// ─── Session Storage Draft Persistence ──────────────────────────────

const DRAFT_KEY = "wizardDraft";

function saveDraft(data: WizardData, currentStep: number): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step: currentStep }));
}

function loadDraft(): { data: WizardData; step: number } | null {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
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

  // Build monthlyData
  const monthlyData = {
    salaries: {},
    expenses: [],
    extraIncomes: [],
    investments: [],
    usdPurchases,
    transfers,
    loans: [],
    salaryOverrides: {},
    aguinaldoOverrides: {},
    _migrationVersion: 7,
  };

  // Build salaryHistory
  const salaryEntries = data.salaryAmount > 0
    ? [{
        id: crypto.randomUUID(),
        effectiveDate: currentMonth,
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

  // Steps: 0=welcome, 1=ARS, 2=USD, 3=income, 4=summary
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
