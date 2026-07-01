### Phase 23: Reconciliar Disponible del Resumen con saldo liquido (calculateDualBalances como fuente de verdad de caja) + resolver timing mes vencido

**Goal:** El "Disponible" del Resumen reconcilia con el saldo líquido de `calculateDualBalances` para cualquier moneda + período. `computeMonthMetrics` deja de ignorar los movimientos que mueven caja (conversiones de moneda, cash_in/out, usdPurchases tracked, préstamos/deudas, retiros de inversión) y `expense-tracker.tsx` le pasa `transfers`/`loans`/`usdPurchases`/`investments`. Se resuelve vía una función pura compartida (`computeCashEffect`) consumida por ambos motores, volviendo innecesario el `adjustment_ars` de cuadre. Cambio de cálculo, sin migración de schema. Ver `PROMPT.md` para el brief completo.
**Requirements**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6 (acceptance criteria en CONTEXT/PROMPT)
**Depends on:** Phase 22
**Plans:** 1/3 plans executed

Plans:
- [x] 23-01-PLAN.md — Función pura compartida `computeCashEffect` + tests del sign table; lock Q1/Q2/Q3 (adjustments excluidos, retiros como caja) (AC-1, AC-4, AC-6)
- [ ] 23-02-PLAN.md — Fold cashEffect en `computeMonthMetrics.disponible` (Resultado conserva D2) + wiring de datos en expense-tracker.tsx + refactor de motores a la función compartida, cero regresión (AC-1, AC-2, AC-4, AC-5)
- [ ] 23-03-PLAN.md — Test de reconciliación con fixture del backup real (ambos motores concuerdan, ARS+USD, ancla junio $28.168,76) + core `computeLiquidFlowForMonth` + script `test` (AC-1, AC-2, AC-3, AC-4, AC-6)
