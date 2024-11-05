import { Category } from "@/hooks/useMoneyTracker";

export const CATEGORIES: Record<Category, { color: string }> = {
  Alquiler: { color: "rgb(239 68 68)" },
  Supermercado: { color: "rgb(59 130 246)" },
  Entretenimiento: { color: "rgb(34 197 94)" },
  Salidas: { color: "rgb(234 179 8)" },
  Vacaciones: { color: "rgb(168 85 247)" },
  Servicios: { color: "rgb(249 115 22)" },
  Vestimenta: { color: "rgb(236 72 153)" },
  Subscripciones: { color: "rgb(99 102 241)" },
  Insumos: { color: "rgb(6 182 212)" },
  Otros: { color: " rgb(100 116 139)" },
  Gym: { color: "rgb(132 204 22)" },
  Estudio: { color: "rgb(20 184 166)" },
};
