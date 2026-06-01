---
phase: quick-260601-otj
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/expense-tracker.tsx
autonomous: true
requirements: [QUICK-260601-OTJ]
must_haves:
  truths:
    - "La línea 'Sobrante anterior' de la card usa el mismo valor (flujo encadenado) que se usó para calcular el 'Disponible' del mes previo"
    - "El banner 'Déficit anterior' se dispara con el resultado de flujo del mes previo, NO con el flujo líquido de caja (que incluye préstamos dados y conversiones a USD)"
    - "Préstamos dados, conversiones ARS↔USD y retiros de inversión NO generan un 'déficit anterior' fantasma"
    - "Con el backup 2026-06-01: junio NO muestra 'Déficit anterior'; mayo cierra +28.232,03 de resultado y junio lo hereda como sobrante"
    - "El mes wizard (el que contiene adjustment_ars) sigue cortando la cadena: su sobrante propagado es 0, sin regresión"
    - "El modo USD de la card hereda el sobrante con la misma lógica de flujo encadenado que ARS"
    - "Los números de 'Disponible' y 'Resultado del mes' ya correctos NO cambian (solo se corrige 'Sobrante anterior' y el banner)"
  artifacts:
    - path: "components/expense-tracker.tsx"
      provides: "sobranteAnteriorChainedArs y sobranteAnteriorChainedUsd como única fuente del sobrante mostrado y del deficitState"
  key_links:
    - from: "computeChainedDisponible (ARS) / computeChainedDisponibleUsd (USD)"
      to: "ResumenCard.sobranteRaw + evaluateDeficitState"
      via: "sobranteAnteriorChainedArs / sobranteAnteriorChainedUsd"
---

<objective>
Unificar la fuente del "Sobrante anterior" mostrado y del banner "Déficit anterior" con la
misma fórmula de FLUJO encadenado que ya produce el número "Disponible" de la card.

Problema (verificado al centavo sobre expense-tracker-backup-2026-06-01 (2).json):
- La card de MAYO muestra Disponible +34.563,56 (motor computeChainedDisponible).
- La card de JUNIO muestra "Déficit anterior: ARS 2.959,03" (motor calculateAvailableForMonth).
- Contradicción: si mayo sobró, junio no arrastra déficit.

Causa raíz: `sobranteAnteriorRawArs = calculateAvailableForMonth(prevMonthKey)` mezcla
flujo del mes con movimientos PATRIMONIALES (préstamo dado 125.000 + conversión ARS→USD
28.800 − retiros 122.608,94), tratándolos como pérdida. Eso produce −2.959,03 en mayo.
La fórmula de flujo (computeChainedDisponible) los ignora correctamente → +28.232,03.

El fix: que la línea "Sobrante anterior" y el banner usen el flujo encadenado, no el flujo
de caja. El "cash líquido real" sigue viviendo en PatrimonioCard (no se toca).

Decisión de diseño confirmada con el usuario: Opción A (flujo encadenado). Aplica a ARS y USD.
</objective>

<execution_context>
@C:/Users/Juan/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/Juan/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/expense-tracker.tsx

<current_state>
En components/expense-tracker.tsx:

- Líneas 268-270: `sobranteAnteriorRawArs = useMemo(() => calculateAvailableForMonth(prevMonthKey), ...)`
  → ESTE es el valor que genera el bug. Alimenta 4 consumidores:
    1. `soranteDelMesAnterior` (clamp ≥0, líneas 273-275) → otros paneles legacy
    2. `arsMetrics` (línea 389, rama `else` cuando NO es post-wizard)
    3. `deficitState` (línea 530) → banner "Déficit anterior" y "recurrente"
    4. `ResumenCard sobranteRaw` (línea 1021) → línea "Sobrante anterior" + banner anterior

- Líneas 340-381: `computeChainedDisponible(monthKey)` — fórmula de FLUJO encadenado correcta.
  Ya corta en el wizardMonth (sobrante propagado = 0). Es la fuente del Disponible.

- Líneas 383-407: `arsMetrics` calcula INLINE el `sobranteReal` correcto (líneas 385-389):
    ```
    const sobranteReal = wizardMonth && selectedMonth > wizardMonth
      ? computeChainedDisponible(prevMonthKey)
      : selectedMonth === wizardMonth
        ? 0
        : sobranteAnteriorRawArs;
    ```
  ESTE `sobranteReal` es EXACTAMENTE lo que la card y el banner deberían mostrar, pero
  está atrapado dentro del useMemo de arsMetrics.

- Líneas 278-319: `computeUsdAvailableForMonth` + `sobranteAnteriorRawUsd`. Mismo problema
  conceptual para USD: incluye transfers y usdPurchases (movimientos patrimoniales).
  NO existe todavía un equivalente "chained" para USD.

- Líneas 409-423: `usdMetrics` usa `sobranteAnteriorRawUsd` directo (sin chained).
- Línea 530: `deficitState` elige sobrante por moneda (`sobranteAnteriorRawUsd` o `...Ars`).
- Líneas 1021 / 1037: card recibe `sobranteRaw` ARS y USD.
</current_state>

<reference_values>
Reconstrucción verificada (payDay=1 → meses calendario), backup 2026-06-01 (2).json:

| Mes   | calculateAvailableForMonth (HOY, bug) | computeChainedDisponible (CORRECTO) |
|-------|---------------------------------------|--------------------------------------|
| abril | 6.331,53 (= wizard month, disponible)  | (wizard: sobrante propagado = 0)     |
| mayo  | −2.959,03  ← genera déficit fantasma   | +34.563,56 (disponible real)         |
| junio | hereda −2.959,03 → banner falso        | hereda +28.232,03 resultado mayo     |

Tras el fix:
- Junio "Sobrante anterior" debe mostrar el disponible encadenado de mayo, NO −2.959,03.
- Junio NO debe mostrar banner "Déficit anterior".
- Disponible y Resultado del mes de cada card NO cambian.
</reference_values>
</context>

<implementation>

PASO 1 — Extraer el sobrante encadenado ARS a su propio useMemo (única fuente de verdad).

Reemplazar el useMemo de `sobranteAnteriorRawArs` (líneas 268-270) por un memo que use la
MISMA lógica que arsMetrics ya tiene inline (385-389). Renombrar a `sobranteAnteriorChainedArs`:

```typescript
// Sobrante anterior ARS — FLUJO encadenado (mismo valor que alimenta el Disponible).
// NO usa calculateAvailableForMonth: ese mezcla movimientos patrimoniales (préstamos
// dados, conversiones ARS↔USD, retiros) que no representan plata gastada y producían
// un "déficit anterior" fantasma. Ver quick-260601-sob.
const sobranteAnteriorChainedArs = useMemo(() => {
  if (wizardMonth && selectedMonth > wizardMonth) {
    return computeChainedDisponible(prevMonthKey);
  }
  if (selectedMonth === wizardMonth) {
    return 0; // el mes wizard no propaga sobrante (flujos one-time de setup)
  }
  // Antes del wizard (o sin wizard): no hay cadena previa → flujo de caja del mes previo.
  return calculateAvailableForMonth(prevMonthKey);
}, [wizardMonth, selectedMonth, prevMonthKey, computeChainedDisponible, calculateAvailableForMonth]);
```

NOTA: la rama `else` final conserva `calculateAvailableForMonth(prevMonthKey)` SOLO para
meses anteriores al wizard / sin wizard, donde no existe cadena de flujo previa. Esto preserva
el comportamiento histórico para meses viejos y evita regresión en el arranque.

PASO 2 — Reusar el nuevo memo en arsMetrics (eliminar el cálculo inline duplicado).

En `arsMetrics` (385-389), reemplazar el bloque `const sobranteReal = ...` por:
```typescript
const sobranteReal = sobranteAnteriorChainedArs;
```
Y actualizar el array de dependencias del useMemo de arsMetrics: quitar `sobranteAnteriorRawArs`,
agregar `sobranteAnteriorChainedArs` (y quitar `wizardMonth`/`prevMonthKey`/`computeChainedDisponible`
de las deps SOLO si ya no se usan en otra parte del cuerpo de arsMetrics — verificar: el bloque
del wizard month en línea 403-404 NO los usa, así que es seguro reducir las deps a las que queden).

PASO 3 — Mantener `soranteDelMesAnterior` apuntando al valor encadenado.

Líneas 273-275: cambiar la dependencia de `sobranteAnteriorRawArs` a `sobranteAnteriorChainedArs`:
```typescript
const soranteDelMesAnterior = useMemo(() => {
  return Math.max(0, sobranteAnteriorChainedArs);
}, [sobranteAnteriorChainedArs]);
```
(Esto mantiene consistente cualquier panel legacy que consuma el sobrante positivo.)

PASO 4 — Construir el equivalente chained para USD.

USD no tiene `computeChainedDisponible`. Crear `computeChainedDisponibleUsd` análogo, justo
después de `computeChainedDisponible` (tras línea 381). Reusa `computeMonthMetrics` con
currency USD y `computeUsdAvailableForMonth` para el caso wizard/pre-wizard:

```typescript
const computeChainedDisponibleUsd = useCallback((monthKey: string): number => {
  if (!wizardMonth || monthKey <= wizardMonth) {
    return computeUsdAvailableForMonth(monthKey);
  }
  const prevKey = format(subMonths(parse(monthKey, "yyyy-MM", new Date()), 1), "yyyy-MM");
  const sobranteAnterior = prevKey === wizardMonth ? 0 : computeChainedDisponibleUsd(prevKey);
  const { start, end } = getFilterDateRange(monthKey, viewMode, incomeConfig.payDay);
  const isInRange = (d: string) => {
    const dt = parse(d, "yyyy-MM-dd", new Date());
    return dt >= start && dt <= end;
  };
  const metrics = computeMonthMetrics({
    monthKey,
    currency: CurrencyType.USD,
    investments: monthlyData.investments || [],
    expenses: monthlyData.expenses,
    extraIncomes: monthlyData.extraIncomes || [],
    salaryAmount: 0,
    aguinaldoAmount: 0,
    sobranteAnteriorRaw: sobranteAnterior,
    isInRange,
  });
  return metrics.disponible;
}, [wizardMonth, computeUsdAvailableForMonth, monthlyData, viewMode, incomeConfig.payDay]);
```

Luego reemplazar `sobranteAnteriorRawUsd` (líneas 316-319) por la versión chained:
```typescript
const sobranteAnteriorChainedUsd = useMemo(() => {
  if (wizardMonth && selectedMonth > wizardMonth) {
    return computeChainedDisponibleUsd(prevMonthKey);
  }
  if (selectedMonth === wizardMonth) {
    return 0;
  }
  return computeUsdAvailableForMonth(prevMonthKey);
}, [wizardMonth, selectedMonth, prevMonthKey, computeChainedDisponibleUsd, computeUsdAvailableForMonth]);
```

PASO 5 — Repuntar todos los consumidores ARS/USD al valor chained.

- Línea 419 (`usdMetrics`): `sobranteAnteriorRaw: sobranteAnteriorChainedUsd` y actualizar deps.
- Línea 530 (`deficitState`): `const activeSobrante = resumenCurrency === "USD" ? sobranteAnteriorChainedUsd : sobranteAnteriorChainedArs;` y actualizar deps del useMemo (líneas 537).
- Línea 1021 (card ARS): `sobranteRaw={sobranteAnteriorChainedArs}`.
- Línea 1037 (card USD): `sobranteRaw: sobranteAnteriorChainedUsd`.

PASO 6 — Buscar referencias residuales.

Grep en components/expense-tracker.tsx por `sobranteAnteriorRawArs` y `sobranteAnteriorRawUsd`:
NO debe quedar ninguna referencia a los nombres viejos. Si queda alguna, repuntarla al
nombre nuevo correspondiente. Confirmar que `usdMetrics` (que se usa también para el modo USD
del Disponible) sigue recibiendo el sobrante correcto.

</implementation>

<verification>
1. `npx tsc --noEmit` (o el typecheck del proyecto) pasa sin errores nuevos.
2. Lint: sin warnings nuevos de react-hooks/exhaustive-deps en los memos tocados.
3. Verificación numérica con el backup 2026-06-01 (2).json (reproducir en node, payDay=1):
   - Seleccionar JUNIO 2026 → "Sobrante anterior" muestra el disponible encadenado de mayo
     (≈ +34.563,56 / hereda resultado +28.232,03), NO −2.959,03.
   - JUNIO 2026 → NO aparece el banner "Déficit anterior".
   - MAYO 2026 → Disponible sigue +34.563,56, Resultado +28.232,03 (sin cambios).
   - ABRIL 2026 (wizard month) → Disponible sigue 6.331,53 (sin regresión; sobrante propagado 0).
   - Toggle a USD en cualquier mes → no crashea, el sobrante USD usa la cadena.
4. Confirmar que PatrimonioCard (saldo líquido) NO cambió — es la card que sí refleja el cash real.
</verification>

<schema_impact>
NINGUNO. El cambio es puramente de cálculo/wiring en el orquestador (components/expense-tracker.tsx).
No toca ninguna entidad persistida en monthlyData ni otra clave del backup.
NO requiere migración ni subir _migrationVersion. Los backups existentes siguen 100% válidos.
</schema_impact>
