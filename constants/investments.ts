export const INVESTMENT_TYPES = ["Plazo Fijo", "FCI", "Crypto", "Acciones"] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];
