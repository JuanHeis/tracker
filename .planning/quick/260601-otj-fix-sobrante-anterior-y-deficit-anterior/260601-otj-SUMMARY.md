# Quick Task 260601-otj — Summary

**Task:** Fix "Sobrante anterior" y banner "Déficit anterior" — usar flujo encadenado (chained) en lugar de cash-flow, para ARS y USD.
**Date:** 2026-06-01
**Files modified:** `components/expense-tracker.tsx` (único)
**Schema impact:** NINGUNO — sin migración, sin bump de `_migrationVersion`. Backups existentes siguen válidos.

## Problema

La línea "Sobrante anterior" y el banner "Déficit anterior"/"recurrente" se alimentaban de
`calculateAvailableForMonth(prevMonthKey)` (flujo de **caja**), mientras que el número
"Disponible" salía de `computeChainedDisponible` (flujo **encadenado**). Las dos fórmulas
difieren porque `calculateAvailableForMonth` cuenta movimientos **patrimoniales** —préstamos
dados, conversiones ARS↔USD, retiros— como si fueran pérdida. Resultado: junio mostraba un
"Déficit anterior" de ARS 2.959,03 que **contradecía** el Disponible +34.563,56 de mayo.

Verificado al centavo contra `expense-tracker-backup-2026-06-01 (2).json`: el gap de mayo
(37.522,59) se descompone en sobrante 6.331,53 + préstamo a Freedom 125.000 + conversión
ARS→USD 28.800 − retiros 122.608,94.

## Cambio aplicado

En `components/expense-tracker.tsx`:

1. Eliminados los memos viejos `sobranteAnteriorRawArs` (cash-flow) y `sobranteAnteriorRawUsd`.
2. Añadido `computeChainedDisponibleUsd` — análogo USD de `computeChainedDisponible`.
3. Añadidos `sobranteAnteriorChainedArs` y `sobranteAnteriorChainedUsd` (flujo encadenado;
   fallback a cash-flow solo para meses pre-wizard/sin cadena previa; wizard month propaga 0).
4. `soranteDelMesAnterior` (clamp ≥0) ahora deriva del valor chained.
5. `arsMetrics` reusa `sobranteAnteriorChainedArs` (eliminado el cálculo inline duplicado).
6. Repointeados todos los consumidores: `usdMetrics`, `deficitState` (ambas monedas),
   y ambos `sobranteRaw` de `ResumenCard` (ARS y USD).

**Ordering / TDZ:** los nuevos memos se ubicaron DESPUÉS de
`computeChainedDisponible`/`computeChainedDisponibleUsd` (dependen de esos helpers declarados
más abajo), evitando un ReferenceError de temporal-dead-zone en render.

## Verificación

- `npx tsc --noEmit` → **0 errores**.
- Grep: **0** referencias residuales a `sobranteAnteriorRawArs` / `sobranteAnteriorRawUsd`.
- Verificación numérica sobre el backup (payDay=1):

  | Mes   | Sobrante anterior ANTES | DESPUÉS    | Déficit anterior ANTES → DESPUÉS |
  |-------|-------------------------|------------|----------------------------------|
  | abril | 0,00                    | 0,00       | false → false (sin cambio)       |
  | mayo  | 6.331,53                | 6.331,53   | false → false (sin cambio)       |
  | junio | −2.959,03               | +28.232,03 | **true → false** (fantasma resuelto) |

- "Disponible" y "Resultado del mes" de cada mes NO cambian (solo se corrigió el sobrante mostrado y el banner).

## Nota de proceso

El gsd-executor original corrió en un worktree branchado de historia commiteada que **no
contenía** el rediseño de resumen (vive solo en el working tree sin commitear del repo
principal). Su archivo reconstruido se **descartó** para no sobrescribir el working tree real;
el fix se aplicó quirúrgicamente sobre `components/expense-tracker.tsx` real (working tree).
