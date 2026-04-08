# Expense Tracker — Contador Personal de Clase Mundial

## What This Is

App de finanzas personales en Next.js que funciona como un contador de clase mundial. Trackea cada peso y dólar: ingresos (sueldo, extras), gastos (con cuotas, tarjetas, recurrentes), inversiones (FCI, crypto, plazo fijo, acciones con aportes/retiros y valor actual), préstamos, y presupuestos por categoría. Soporta dual ARS/USD con cotización real. Todo en localStorage con export/import JSON.

El usuario siempre sabe exactamente: cuánta plata tiene disponible, cuánto tiene invertido, cuánto ganó, cuánto perdió, y en qué gastó.

## Core Value

Reflejar la realidad financiera exacta del usuario en todo momento — nunca perderse un peso ni un dólar, con cálculos correctos que coincidan con lo que realmente pasa en sus cuentas.

## Requirements

### Validated

<!-- v1.0 MVP — 46 requirements shipped -->
- ✓ Bug fixes (7), Inversiones (10), Moneda dual (8), Ingresos (8), Card mensual (5) — v1.0
- ✓ Recurrentes (4), Préstamos (4), Presupuestos (3), Transferencias (2), Ajustes/Persistencia (3), UX (2) — v1.0
- ✓ Setup Wizard (10), Manual (1) — v1.1
- ✓ Recharts Upgrade (3), Projection Engine (5), Chart Components (5), Simulador (6) — v1.2

### Active

**Flujo Mensual Panel Unificado (v1.3):**
- [ ] Waterfall chart del flujo mensual (ingresos → fijos → variables → inversiones → libre)
- [ ] Selector tasa de ahorro con 3 modos (auto/porcentaje/fijo)
- [ ] Mini-proyección inline patrimonio a 12 meses
- [ ] Refactor: reemplazar estimateMonthlyNetSavings() con computeSavingsEstimate()
- [ ] Persistencia SavingsRateConfig en localStorage (key propia)

**Bugs críticos (cálculos rotos) — RESUELTOS v1.0:**
- [ ] Fix inversiones que siempre se guardan como ARS (ignorando moneda original)
- [ ] Fix tipos de inversión que no coinciden entre dialog y types
- [ ] Fix "Total disponible" que mezcla todos los meses y estados de inversión
- [ ] Fix división por cero cuando usdRate es 0
- [ ] Fix fechas de cuotas que se corrompen (31/01 + 3 cuotas → las siguientes caen mal)
- [ ] Fix cuotas no editables al editar un gasto
- [ ] Fix formulario de sueldo que no pre-carga valores al editar

**Modelo de inversiones (refactorización completa):**
- [ ] Inversión como cuenta (no transacción): nombre, tipo, moneda base, status, currentValue, movements[]
- [ ] Aportes y retiros como movements (positivo = aporte, negativo = retiro)
- [ ] Actualizar valor actual manualmente (inline en tabla, sin modal)
- [ ] Finalizar inversión (atajo: retiro total + status Finalizada + currentValue 0)
- [ ] Mostrar ganancia/pérdida y rendimiento % por inversión
- [ ] Aviso "valor desactualizado" si lastUpdated > 7 días
- [ ] Plazo Fijo: auto-cálculo de valor actual con tasa (solo ARS)
- [ ] Crypto siempre en USD, FCI en ARS o USD, Acciones según mercado

**Modelo dual ARS/USD:**
- [ ] Saldos reales separados en ARS y USD
- [ ] Cotización por transacción (guardada al momento del gasto/ingreso)
- [ ] Cotización global actual para calcular patrimonio total en ARS
- [ ] Compra de USD: resta ARS, suma USD (o registro libre de efectivo no trackeado)
- [ ] Origen de compra explícito (cuenta trackeada vs efectivo libre)
- [ ] Ganancia/pérdida cambiaria automática (cotización compra vs actual)
- [ ] Editar cotización USD retroactivamente si se cargó mal

**Fecha de cobro e ingreso fijo:**
- [ ] Renombrar "Salario" → "Ingreso fijo" / "Sueldo/Ingreso principal"
- [ ] Renombrar "Ingresos extras" → "Otros ingresos"
- [ ] Fecha de cobro configurable (ej: día 10)
- [ ] Vista "período personalizado" (del 10 al 9 del siguiente)
- [ ] Vista "mes calendario" con indicador "Pendiente de cobro" antes de la fecha
- [ ] Poder elegir entre ambas vistas
- [ ] Sueldo afecta mes corriente y siguiente en caso de aumento
- [ ] Aguinaldo auto-calculado para relación de dependencia (50% mejor sueldo del semestre en junio/diciembre)
- [ ] Aguinaldo oculto si el usuario es independiente

**Tarjetas de crédito:**
- [ ] Tarjetas como entidad (nombre, banco, fecha cierre, fecha vencimiento)
- [ ] Gastos en cuotas asociados a una tarjeta
- [ ] Fecha de cobro de cada cuota según cierre/vencimiento de la tarjeta
- [ ] Vista de resumen por tarjeta (cuánto debés este mes, próximo mes, total)

**Gastos recurrentes:**
- [ ] Definir gasto recurrente una vez (nombre, monto, categoría, frecuencia)
- [ ] Auto-generación mensual
- [ ] Pausar/cancelar recurrente
- [ ] Marcar como pagado cada mes

**Card mensual rediseñada:**
- [ ] Resumen claro: Ingresos (sueldo + otros) / Egresos (gastos + aportes inversiones) / Disponible
- [ ] Separación visual "Este mes" vs "Histórico (todos los meses)"
- [ ] Patrimonio total = Dinero líquido + Σ currentValue inversiones activas
- [ ] Desglose con fórmula visible (cómo se calcula cada número)
- [ ] Colores: verde ingresos, rojo egresos, azul inversiones

**Préstamos:**
- [ ] Registrar "le presté $X a Juan" como dinero que va a volver
- [ ] Registrar "debo $X a María" como deuda pendiente
- [ ] Afecta patrimonio (préstamo dado = activo, deuda = pasivo)
- [ ] Marcar como cobrado/pagado (vuelve/sale del líquido)

**Presupuestos por categoría:**
- [ ] Definir tope mensual por categoría (ej: "Delivery máx $200k")
- [ ] Barra de progreso visual
- [ ] Alerta al acercarse al límite

**Transferencias entre cuentas:**
- [ ] Registrar movimiento entre cuentas propias (banco a MP, ARS a USD)
- [ ] No afecta patrimonio — solo cambia dónde está la plata

**Cuentas (opcional, preparar arquitectura):**
- [ ] Pool único por defecto (todo en un solo saldo)
- [ ] Dejar puerta abierta para multi-cuenta futura (Banco X, Banco Y, MP, efectivo)

**Ajustes manuales:**
- [ ] Botón "Ajustar saldo real" que crea ingreso/gasto de ajuste automático
- [ ] Actualizar valor de inversión inline
- [ ] Marcar inversión como finalizada con monto real cobrado

**Inflación:**
- [ ] Ajuste por IPC para comparar valores entre meses en pesos constantes
- [ ] Mostrar "equivale a $X de hoy" en valores históricos

**Persistencia:**
- [ ] Mantener localStorage como almacenamiento principal
- [ ] Exportar datos completos a JSON
- [ ] Importar datos desde JSON (con validación)

**UI/UX general:**
- [ ] Terminología estándar de finanzas personales (patrimonio, líquido, etc.)
- [ ] Cada número con tooltip o desglose que explique cómo se calcula
- [ ] Validar monto > 0 y cotización USD > 0 en formularios

### Out of Scope

- Chat en tiempo real o funciones sociales — app personal
- Mobile app nativa — web-first, responsive
- OAuth / login con Google — no hay usuarios, es local
- Video/imagen en transacciones — solo datos numéricos
- Conexión automática a bancos/brokers — actualización manual
- Cálculo automático de impuestos (monotributo, ganancias) — demasiado complejo y varía por situación
- Sincronización multi-dispositivo — sin backend, solo export/import

## Current Milestone: v1.3 — Flujo Mensual Panel Unificado

**Goal:** Panel de flujo mensual que muestre waterfall del mes, selector de tasa de ahorro con 3 modos, mini-proyección inline, y reemplace estimateMonthlyNetSavings() por tasa de ahorro real/configurada.

**Target features:**
- Waterfall chart: Ingresos → Gastos fijos (recurrentes) → Gastos variables (manuales) → Inversiones → Libre
- Selector tasa de ahorro: 3 modos (auto/porcentaje/fijo) que alimenta proyecciones patrimoniales
- Mini-proyección inline: Patrimonio estimado a 12 meses con escenarios, debajo del waterfall
- Refactor proyecciones: Reemplazar estimateMonthlyNetSavings() con computeSavingsEstimate()

## Context

**Estado actual:** App completa con v1.0 + v1.1. Todas las features core funcionando: inversiones, dual ARS/USD, ingresos, gastos recurrentes, préstamos, presupuestos, transferencias, export/import, setup wizard, manual. El usuario ya está usando la app con datos reales.

**Stack:** Next.js, TypeScript, localStorage. UI con componentes propios sobre fondo oscuro con gradiente.

**Codebase map disponible** en `.planning/codebase/` — la arquitectura actual está mapeada.

**Informe de bugs y mejoras:** Proporcionado por el usuario con análisis detallado de 7 bugs confirmados, 4 problemas conceptuales, y propuestas de solución inspiradas en YNAB y Fintual.

**Público:** El propio usuario (y potencialmente otros que quieran un tracker offline serio).

**Contexto financiero argentino:** Inflación alta, dualidad ARS/USD, aguinaldo SAC, plazos fijos en pesos con tasas variables, crypto en USD.

## Constraints

- **Storage**: localStorage del navegador — sin backend, sin base de datos
- **Moneda**: Dual ARS/USD obligatorio — Argentina opera en ambas monedas
- **Offline**: Debe funcionar 100% sin internet (excepto cotización USD que es manual)
- **Compatibilidad datos**: Migración desde estructura actual de localStorage sin perder datos del usuario
- **UI**: Conservar estilo visual actual en lo posible, pero no hay restricción si el cambio mejora la UX

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Inversión como cuenta, no transacción | Patrón YNAB/Fintual. Una inversión tiene aportes y retiros, no es un gasto único | — Pending |
| Dual ARS/USD con saldos reales | El usuario tiene dólares reales, no solo conversión visual | — Pending |
| Cotización por transacción + global | La por-transacción registra el momento, la global calcula patrimonio actual | — Pending |
| Tarjetas como entidad propia | Permite modelar cierre, vencimiento, y cuotas correctamente | — Pending |
| Fecha de cobro con doble vista | No todos cobran el 1ro. Período personalizado + mes calendario con indicador | — Pending |
| Aguinaldo auto-calc condicional | Auto para dependencia, oculto para independientes | — Pending |
| Cuentas opcionales (pool default) | El usuario quiere pool pero dejar la puerta abierta a multi-cuenta | — Pending |
| localStorage + export/import | Sin backend, pero con backup manual en JSON | — Pending |

---
*Last updated: 2026-04-07 — milestone v1.3 started*
