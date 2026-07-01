# Reconciliar el "Disponible" del Resumen con el saldo líquido real

## Contexto del Proyecto

App de finanzas personales en Next.js (client-side only, localStorage), en español argentino. Dual currency ARS/USD. Sin backend. `useMoneyTracker` orquesta sub-hooks; persistencia vía `useLocalStorage`.

**El usuario usa la app en vivo con datos reales** → cualquier cambio debe respetar el schema de localStorage (ver memoria `feedback_json_safety`).

---

## Síntoma (caso real verificado — junio 2026, ARS, vista Período, payDay 1)

El "Disponible" del Resumen del Mes queda **inflado**. Junio da **$390.668,76** cuando la billetera real cerró en **$28.168,76**.

La diferencia son exactamente **$362.500**: una compra de dólares (`currency_ars_to_usd`, 2026-06-04, $362.500 → US$250) que **salió de la cuenta** pero el Resumen **NO la descuenta** como egreso.

---

## Causa raíz

`computeMonthMetrics` ([lib/resumen/month-metrics.ts](../../../lib/resumen/month-metrics.ts)) arma los egresos como `totalGastos + aportesNoNeutros` **y nada más**. Ignora movimientos que SÍ mueven plata líquida:

- Conversiones de moneda (`currency_ars_to_usd`, `currency_usd_to_ars`)
- `cash_out` / `cash_in`
- `usdPurchases` con origin `"tracked"`
- Préstamos dados (`preste`) y pagos de deuda (`debo`)

**Peor:** en [components/expense-tracker.tsx](../../../components/expense-tracker.tsx), `computeChainedDisponible` (~L330-371) y los metrics memoizados (~L430-467) llaman a `computeMonthMetrics` **sin pasarle** `transfers`, `loans` ni `usdPurchases` — la data ni siquiera llega al cálculo.

En cambio `calculateDualBalances` ([hooks/useMoneyTracker.ts](../../../hooks/useMoneyTracker.ts) ~L370-577) SÍ cuenta todo esto correctamente.

**El bug es que hay dos motores que deberían dar lo mismo y divergen.**

---

## Objetivo del fix

Que el "Disponible" del Resumen, para una **moneda + período**, **reconcilie con el saldo líquido** de `calculateDualBalances` para esa misma moneda + período. Usar `calculateDualBalances` como **fuente de verdad** de los efectos de caja:

| Movimiento              | ARS                | USD          |
|-------------------------|--------------------|--------------|
| `currency_ars_to_usd`   | −arsAmount         | +usdAmount   |
| `currency_usd_to_ars`   | +arsAmount         | −usdAmount   |
| `cash_out` / `cash_in`  | ∓amount (currency) |              |
| usdPurchase (`tracked`) | −arsAmount         | +usdAmount   |
| préstamo "presté"       | −amount + Σpagos   | ídem moneda  |
| deuda "debo"            | −Σpagos            | ídem moneda  |

Todo filtrado por el rango del período (`getFilterDateRange` / `isInRange`) y por moneda, **igual que hoy con gastos y aportes**.

---

## Decisión de diseño a resolver (timing "mes vencido") — NO ignorar

El usuario cobra el **último día del mes a mes vencido** y trata ese cobro como plata del **mes SIGUIENTE**. El sueldo ya se maneja por `effectiveDate` (sueldo nuevo efectivo julio).

Pero hay movimientos **en el borde**: ej. un préstamo del 30/06 hecho con el cobro que corresponde a julio. Si se cuentan crudos por fecha caen en junio y descuadran.

**Definir cómo asignar los movimientos del borde al período correcto** (probablemente alineando `payDay` / pay-period al **día de cobro real**, no `payDay=1`) para que Resumen y saldo usen el **MISMO criterio**.

Hoy el saldo tapa este desfasaje con un `adjustment_ars` gigante (~$4,1M): **ese parche debe volverse innecesario** cuando los dos motores coincidan.

Ver memoria `project_mes_vencido_model` (devengado vs caja).

---

## Restricciones (modelo de datos)

- Es cambio de **CÁLCULO, no de datos**: NO cambia el schema, NO requiere migración (`_migrationVersion` queda igual).
- Preservar la cadena **"sobrante anterior"** (disponible del mes → sobrante del siguiente).
- Preservar la lógica de aportes por `purpose` (tarjeta/objetivo = neutros; ahorro/especulación = restan).
- **Simetría ARS/USD.**
- NO reutilizar `isInitial` (solo wizard, ver memoria `feedback_isinitial_wizard_only`) ni `pendingIngreso` para excluir nada; si hace falta excluir, **flag nuevo con nombre propio**.

---

## Criterios de Aceptación

- [ ] Resumen ARS junio 2026 "Disponible" pasa de $390.668,76 a **$28.168,76** (se descuentan los $362.500 de la compra de dólares; con el timing resuelto, el préstamo del 30/06 queda en el ciclo de julio, no en junio).
- [ ] Para **cualquier** moneda + período: **`Disponible(Resumen)` == saldo líquido (`calculateDualBalances`)**. Hoy divergen; ese es el test de que el fix quedó bien.
- [ ] El `adjustment_ars` de cuadre deja de ser necesario para que los dos números coincidan.
- [ ] Simetría ARS/USD verificada.
- [ ] Sin cambios de schema / sin migración (`_migrationVersion` intacto).
- [ ] Los cálculos de efectos de caja son funciones puras testeables.
