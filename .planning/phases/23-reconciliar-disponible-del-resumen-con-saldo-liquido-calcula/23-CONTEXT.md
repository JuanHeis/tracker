# Phase 23: Reconciliar Disponible del Resumen con saldo líquido - Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

El "Disponible" del Resumen del Mes (`computeMonthMetrics`) debe reconciliar con el saldo
líquido de `calculateDualBalances` para cualquier moneda (ARS/USD) + período. Es un cambio
de **cálculo**, no de datos: sin migración, `_migrationVersion` intacto.

Entra en scope:
- Que `computeMonthMetrics` deje de ignorar los movimientos que mueven caja: conversiones
  de moneda (`currency_ars_to_usd`, `currency_usd_to_ars`), `cash_out`/`cash_in`,
  `usdPurchases` con origin `"tracked"`, préstamos dados (`preste`) y pagos de deuda (`debo`).
- Que `expense-tracker.tsx` le pase la data faltante (`transfers`, `loans`, `usdPurchases`)
  al motor (hoy no llegan a `computeChainedDisponible` ni a los metrics memoizados).
- Alinear el criterio de timing "mes vencido" entre ambos motores.

Fuera de scope (paso separado, ver decisiones):
- Corregir el dato `adjustment_ars` (~$4,1M) en el backup del usuario.
</domain>

<decisions>
## Implementation Decisions

### Arquitectura — fuente de verdad única
- **Extraer una función pura compartida** de efectos de caja que consuman AMBOS motores
  (`calculateDualBalances` en `hooks/useMoneyTracker.ts` y `computeMonthMetrics` en
  `lib/resumen/month-metrics.ts`). Single source of truth → imposible que vuelvan a divergir.
- La función vive en `lib/` (pura, sin React/localStorage/Date.now), recibe
  `transfers`/`loans`/`usdPurchases` + `currency` + `isInRange` y devuelve el efecto neto
  de caja del período para esa moneda.
- Tabla de efectos de caja (fuente de verdad = comportamiento actual de `calculateDualBalances`):
  - `currency_ars_to_usd`: ARS −arsAmount / USD +usdAmount
  - `currency_usd_to_ars`: ARS +arsAmount / USD −usdAmount
  - `cash_out` / `cash_in`: ∓amount en la moneda del transfer
  - usdPurchase (origin `"tracked"`): ARS −arsAmount / USD +usdAmount
  - préstamo "presté": −amount + Σpagos (misma moneda)
  - deuda "debo": −Σpagos (misma moneda)
- `computeMonthMetrics`: `egresosMes` pasa a incluir el efecto de caja negativo de estos
  movimientos, y los efectos positivos (cash_in, conversión entrante, cobro de préstamo)
  entran como ingreso/reducción de egreso, **preservando** la fórmula existente
  `Disponible = sobranteAnteriorRaw + ingresosMes − egresosMes`.

### Timing "mes vencido"
- **Alinear `payDay` al día de cobro real** (fin de mes), no `payDay=1`. Ambos motores ya
  filtran con `getFilterDateRange(monthKey, viewMode, payDay)` → con el mismo `payDay`
  quedan sincronizados y los movimientos del borde (ej. préstamo del 30/06 hecho con el
  cobro de julio) caen en el ciclo de julio.
- El sueldo ya se resuelve por `effectiveDate` / `getSalaryForMonth(monthKey)` (assign por
  monthKey, no por rango de fecha), así que no lo afecta esta ventana.
- Criterio ÚNICO compartido: la ventana `getFilterDateRange(payDay)` es la misma que usan
  Resumen y saldo. No inventar un segundo criterio de rango.

### adjustment_ars (~$4,1M)
- Esta fase es **solo cálculo, no toca datos**. Una vez que los motores reconcilian, el
  `adjustment_ars` de cuadre queda redundante.
- La corrección del dato en el backup del usuario es un **paso separado, verificado**
  (via UI o edición del backup respaldando el original primero — ver memoria
  `feedback_manual_corrections`). NO se hace en esta fase.
- OJO doble-conteo: el `adjustment_ars` es el seed inicial del wizard (marca el `wizardMonth`).
  Validar en planning si es seed legítimo (patrimonio inicial) vs fudge de cuadre antes de
  proponer su corrección. No borrar a ciegas.

### Verificación
- **Test unitario** con fixture derivado del backup real exportado (junio 2026,
  `expense-tracker-backup-2026-06-30.json`): corre AMBOS motores y asERTA
  `Disponible(Resumen) == saldo líquido (calculateDualBalances)` para ARS y USD.
- Caso ancla: Resumen ARS junio 2026 "Disponible" == **$28.168,76** (hoy $390.668,76;
  la diferencia son los $362.500 de la compra de dólares `currency_ars_to_usd` del 2026-06-04).
- El test es la red de seguridad permanente contra futuras divergencias.

### Restricciones (heredadas del brief)
- Preservar la cadena "sobrante anterior" (disponible del mes → sobrante del siguiente).
- Preservar la lógica de aportes por `purpose` (tarjeta/objetivo = neutros;
  ahorro/especulación = restan) — `sumAportes` no cambia.
- Simetría ARS/USD.
- NO reutilizar `isInitial` (solo wizard) ni `pendingIngreso` para excluir nada; si hace
  falta excluir, flag nuevo con nombre propio.
- Sin cambio de schema, sin migración (`_migrationVersion` igual).
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `calculateDualBalances` (`hooks/useMoneyTracker.ts` ~L370-577) — fuente de verdad de los
  efectos de caja; ya maneja transfers/loans/usdPurchases con filtrado por `getFilterDateRange`.
  De acá se extrae la función pura compartida.
- `computeMonthMetrics` / `sumAportes` (`lib/resumen/month-metrics.ts`) — motor puro del
  Resumen; preserva fórmula Disponible = sobrante + ingresos − egresos.
- `getFilterDateRange(monthKey, viewMode, payDay)` — ventana de período compartida (ARS y USD).

### Established Patterns
- Motores de cálculo puros en `lib/` (sin React/localStorage/Date.now); el caller inyecta
  `isInRange`. Mantener esta pureza en la función compartida.
- El mes wizard usa `calculateAvailableForMonth` (incluye flujos); los meses encadenados
  usan `computeMonthMetrics` (hoy NO incluye flujos) → origen de la divergencia en meses
  no-wizard como junio 2026.

### Integration Points
- `computeChainedDisponible` (`components/expense-tracker.tsx` ~L330-371) y `arsMetrics`/
  `usdMetrics` memoizados (~L433-468) llaman a `computeMonthMetrics` SIN pasar
  `transfers`/`loans`/`usdPurchases`. Hay que ampliar el input y pasar la data.
- `computeChainedDisponibleUsd` (~L376-399) — análogo USD, mismo cambio.
</code_context>

<specifics>
## Specific Ideas

- Caso real verificado: compra de dólares `currency_ars_to_usd`, 2026-06-04, $362.500 → US$250.
- Backups disponibles en la raíz del repo: `expense-tracker-backup-2026-06-30.json` y
  `expense-tracker-backup-2026-06-30.ORIGINAL.json` (base para el fixture del test).
</specifics>

<deferred>
## Deferred Ideas

- Corrección del dato `adjustment_ars` en el backup del usuario (paso separado post-reconciliación).
- Evaluar si el mes wizard puede unificar su rama especial (`calculateAvailableForMonth`) con
  la fórmula general una vez que los motores reconcilian — solo si no rompe la cadena de sobrante.
</deferred>
