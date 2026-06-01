/**
 * Purpose suggestion heuristic for the Phase 22 investment-purpose migration wizard.
 *
 * Pure function. Caller is expected to display the suggestion as a default in the wizard
 * row's Select, and the user can override before accepting.
 *
 * Priority order (first match wins):
 *   1. name matches /tarjeta|tc|sbs.*rta.*pesos/i  → "tarjeta"
 *   2. name matches /piano|viaje|auto|casa/i       → "objetivo"
 *   3. type === "Cuenta remunerada"                → "objetivo"
 *   4. type === "Acciones"                         → "especulacion"
 *   5. default                                     → "ahorro"
 *
 * Note: The "Acciones" type covers all stock-like instruments stored under that type
 * (see constants/investments.ts).
 */
import { type InvestmentPurpose } from "@/hooks/useMoneyTracker";
import { type InvestmentType } from "@/constants/investments";

const TARJETA_PATTERN = /tarjeta|tc|sbs.*rta.*pesos/i;
const OBJETIVO_NAME_PATTERN = /piano|viaje|auto|casa/i;

export function suggestPurpose(inv: { name: string; type: InvestmentType }): InvestmentPurpose {
  if (TARJETA_PATTERN.test(inv.name)) return "tarjeta";
  if (OBJETIVO_NAME_PATTERN.test(inv.name)) return "objetivo";
  if (inv.type === "Cuenta remunerada") return "objetivo";
  if (inv.type === "Acciones") return "especulacion";
  return "ahorro";
}
