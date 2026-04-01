export const INVESTMENT_TYPES = ["Plazo Fijo", "FCI", "Crypto", "Acciones"] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

export enum CurrencyType {
  ARS = "ARS",
  USD = "USD",
}

export const CURRENCY_ENFORCEMENT: Record<InvestmentType, CurrencyType | null> = {
  "Crypto": CurrencyType.USD,
  "Plazo Fijo": CurrencyType.ARS,
  "FCI": null,       // User choice
  "Acciones": null,   // User choice
};
