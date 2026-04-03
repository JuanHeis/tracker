interface ChartDisclaimerProps {
  globalUsdRate: number;
}

export function ChartDisclaimer({ globalUsdRate }: ChartDisclaimerProps) {
  return (
    <p className="text-xs text-muted-foreground mt-2 text-center italic">
      Proyeccion a cotizacion actual: $
      {globalUsdRate.toLocaleString("es-AR")} ARS/USD. Tasas de crecimiento
      estimadas, no garantizadas.
    </p>
  );
}
