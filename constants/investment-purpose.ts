import type { Investment, InvestmentMovement, InvestmentPurpose } from "@/hooks/useMoneyTracker";

export const INVESTMENT_PURPOSE_ORDER: InvestmentPurpose[] = ["ahorro", "objetivo", "tarjeta", "especulacion"];

export const INVESTMENT_PURPOSE_LABELS: Record<InvestmentPurpose, string> = {
  ahorro: "Ahorro",
  objetivo: "Objetivo",
  tarjeta: "Tarjeta",
  especulacion: "Especulación",
};

/** Effective purpose for a movement: movement override → investment default → "ahorro" (D14). */
export function getMovementPurpose(mov: InvestmentMovement, inv: Investment): InvestmentPurpose {
  return mov.purpose ?? inv.purpose ?? "ahorro";
}
