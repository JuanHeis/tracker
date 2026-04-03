import type { InvestmentType, CurrencyType } from "@/constants/investments";

// --- Interfaces ---

export interface InvestmentProjection {
  investmentId: string;
  investmentName: string;
  type: InvestmentType;
  currencyType: CurrencyType;
  currentValue: number;
  monthlyContribution: number; // 0 if aportes futuros disabled
  annualRate: number; // Rate used for projection
  projectedValues: number[]; // Array indexed by future month (0=current)
}

export interface HistoricalPoint {
  monthKey: string; // "yyyy-MM"
  patrimony: number; // Total in ARS (USD converted at globalUsdRate)
}

export interface ProjectionDataPoint {
  month: string; // Display label: "Ene 26", "Feb 26"
  monthKey: string; // "2026-01" for internal use
  historicalPatrimony: number | null;
  proyeccionOptimista: number | null;
  proyeccionBase: number | null;
  proyeccionPesimista: number | null;
}

export interface ScenarioConfig {
  name: "optimista" | "base" | "pesimista";
  rateMultiplier: number;
  savingsMultiplier: number;
}

export interface ProjectionSummary {
  optimista: number;
  base: number;
  pesimista: number;
}

export interface UseProjectionEngineReturn {
  patrimonyData: ProjectionDataPoint[];
  investmentProjections: InvestmentProjection[];
  currentMonthIndex: number;
  currentPatrimony: number;
  projectedPatrimony: ProjectionSummary;
  incomeProjection: number[]; // Flat-line salary projection for N months (PROJ-03)
  horizonMonths: number;
}

// --- Constants ---

export const DEFAULT_ANNUAL_RATES: Record<InvestmentType, number> = {
  "Plazo Fijo": 0, // Uses TNA from investment
  "FCI": 0.40, // 40%
  "Crypto": 0.15, // 15%
  "Acciones": 0.12, // 12%
  "Cuenta remunerada": 0.35, // 35%
};

export const SCENARIOS: ScenarioConfig[] = [
  { name: "optimista", rateMultiplier: 1.5, savingsMultiplier: 1.1 },
  { name: "base", rateMultiplier: 1.0, savingsMultiplier: 1.0 },
  { name: "pesimista", rateMultiplier: 0.5, savingsMultiplier: 0.8 },
];
