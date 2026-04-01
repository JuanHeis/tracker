# Requirements: Expense Tracker — Contador Personal

**Defined:** 2026-04-01
**Core Value:** Reflejar la realidad financiera exacta del usuario en todo momento — nunca perderse un peso ni un dólar.

## v1 Requirements

### Bug Fixes

- [ ] **BUG-01**: Fix inversiones que siempre se guardan como ARS ignorando moneda original
- [ ] **BUG-02**: Fix tipos de inversión que no coinciden entre dialog ("FCI","PlazoFijo","Crypto") y types ("Plazo Fijo","Bonos")
- [ ] **BUG-03**: Fix calculateTotalAvailable() que suma todo sin filtrar por mes ni estado de inversión
- [ ] **BUG-04**: Fix división por cero cuando usdRate es 0 (muestra Infinity/NaN)
- [ ] **BUG-05**: Fix fechas de cuotas que se corrompen (gasto 31/01 con 3 cuotas → cuota 3 cae 28/03 en vez de 31/03)
- [ ] **BUG-06**: Fix campo de cuotas deshabilitado al editar un gasto existente
- [ ] **BUG-07**: Fix formulario de sueldo que no pre-carga valores actuales al editar

### Inversiones

- [ ] **INV-01**: User puede crear inversión como cuenta con nombre, tipo, moneda base y status
- [ ] **INV-02**: User puede registrar aportes (movements positivos) que restan del líquido del mes
- [ ] **INV-03**: User puede registrar retiros (movements negativos) que vuelven al líquido del mes
- [ ] **INV-04**: User puede actualizar el valor actual de una inversión inline (sin modal)
- [ ] **INV-05**: User puede finalizar inversión (retiro total automático + status Finalizada + currentValue 0)
- [ ] **INV-06**: User ve ganancia/pérdida y rendimiento % por cada inversión (currentValue vs total invertido)
- [ ] **INV-07**: User ve aviso "valor desactualizado" si lastUpdated > 7 días
- [ ] **INV-08**: Plazo Fijo auto-calcula valor actual según tasa y días transcurridos (solo ARS)
- [ ] **INV-09**: Crypto siempre en USD, FCI en ARS o USD según elección, Acciones según mercado
- [ ] **INV-10**: Tabla de inversiones muestra: nombre, tipo, capital invertido, valor actual, ganancia, %, última actualización, acciones

### Moneda Dual

- [ ] **MON-01**: User tiene saldos reales separados en ARS y USD (no solo conversión visual)
- [ ] **MON-02**: Cada transacción guarda la cotización USD del momento en que se registró
- [ ] **MON-03**: User puede configurar cotización global actual para calcular patrimonio total en ARS
- [ ] **MON-04**: User puede comprar USD desde saldo ARS (resta ARS, suma USD, patrimonio no cambia)
- [ ] **MON-05**: User puede registrar USD de efectivo no trackeado (suma USD sin restar ARS, con origen explícito)
- [ ] **MON-06**: User ve ganancia/pérdida cambiaria automática (cotización de compra vs global actual)
- [ ] **MON-07**: User puede editar cotización USD retroactivamente si la cargó mal
- [ ] **MON-08**: Validación: cotización USD siempre > 0, monto siempre > 0

### Ingresos y Fecha de Cobro

- [ ] **ING-01**: Terminología renombrada: "Salario" → "Ingreso fijo", "Ingresos extras" → "Otros ingresos"
- [ ] **ING-02**: User puede configurar fecha de cobro del ingreso fijo (ej: día 10)
- [ ] **ING-03**: User puede ver vista "período personalizado" (del día de cobro al día anterior del mes siguiente)
- [ ] **ING-04**: User puede ver vista "mes calendario" con indicador "Pendiente de cobro" antes de la fecha
- [ ] **ING-05**: User puede alternar entre ambas vistas según preferencia
- [ ] **ING-06**: Aumento de sueldo afecta al mes corriente y a los siguientes
- [ ] **ING-07**: Aguinaldo auto-calculado para relación de dependencia (50% mejor sueldo del semestre, junio/diciembre)
- [ ] **ING-08**: User puede indicar si es dependiente o independiente; aguinaldo oculto para independientes

### Card Mensual

- [ ] **CARD-01**: Resumen mensual con desglose claro: Ingresos (fijo + otros) / Egresos (gastos + aportes inversiones) / Disponible
- [ ] **CARD-02**: Separación visual explícita "Este mes" vs "Histórico (todos los meses)" con etiquetas y colores distintos
- [ ] **CARD-03**: Patrimonio total = Dinero líquido ARS + Dinero líquido USD (convertido) + Σ currentValue inversiones activas
- [ ] **CARD-04**: Cada número muestra tooltip o desglose de cómo se calcula
- [ ] **CARD-05**: Colores semánticos: verde ingresos, rojo egresos, azul inversiones

### Gastos Recurrentes

- [ ] **REC-01**: User puede definir gasto recurrente (nombre, monto, categoría, frecuencia mensual)
- [ ] **REC-02**: Gastos recurrentes se auto-generan cada mes
- [ ] **REC-03**: User puede pausar o cancelar un gasto recurrente
- [ ] **REC-04**: User puede marcar gasto recurrente como pagado cada mes

### Préstamos

- [ ] **PREST-01**: User puede registrar "le presté $X a [persona]" con fecha y monto
- [ ] **PREST-02**: User puede registrar "debo $X a [persona]" con fecha y monto
- [ ] **PREST-03**: Préstamo dado cuenta como activo, deuda cuenta como pasivo en patrimonio
- [ ] **PREST-04**: User puede marcar préstamo como cobrado (vuelve al líquido) o deuda como pagada (sale del líquido)

### Presupuestos

- [ ] **PRES-01**: User puede definir tope mensual por categoría de gasto
- [ ] **PRES-02**: User ve barra de progreso visual del gasto vs presupuesto por categoría
- [ ] **PRES-03**: User ve alerta visual al acercarse al límite del presupuesto

### Transferencias

- [ ] **TRANS-01**: User puede registrar transferencia entre cuentas propias (banco a MP, ARS a USD)
- [ ] **TRANS-02**: Transferencia no afecta patrimonio — solo cambia dónde está la plata

### Ajustes y Persistencia

- [ ] **AJUST-01**: User puede "Ajustar saldo real" — crea ingreso/gasto de ajuste automático para cuadrar con realidad
- [ ] **PERS-01**: User puede exportar todos los datos a archivo JSON
- [ ] **PERS-02**: User puede importar datos desde archivo JSON con validación

### UX General

- [ ] **UX-01**: Terminología estándar de finanzas personales en toda la app (patrimonio, líquido, etc.)
- [ ] **UX-02**: Formularios validan monto > 0 y cotización USD > 0

## v2 Requirements

### Tarjetas de Crédito

- **TC-01**: Tarjetas como entidad (nombre, banco, fecha cierre, fecha vencimiento)
- **TC-02**: Gastos en cuotas asociados a tarjeta específica
- **TC-03**: Fecha de cobro de cada cuota según cierre/vencimiento de la tarjeta
- **TC-04**: Vista de resumen por tarjeta (cuánto debés este mes, próximo, total)

### Inflación

- **IPC-01**: Ajuste por IPC para comparar valores entre meses en pesos constantes
- **IPC-02**: Mostrar "equivale a $X de hoy" en valores históricos

### Cuentas Múltiples

- **CTA-01**: Definir cuentas (Banco X, Banco Y, MP, efectivo)
- **CTA-02**: Cada transacción asociada a una cuenta
- **CTA-03**: Ver saldo por cuenta individual + total consolidado

## Out of Scope

| Feature | Reason |
|---------|--------|
| Conexión automática a bancos/brokers | Complejidad y seguridad, actualización manual suficiente |
| Mobile app nativa | Web-first responsive, no justifica app nativa |
| OAuth / login | App local sin usuarios, no necesita autenticación |
| Cálculo automático de impuestos | Demasiado complejo, varía por situación fiscal |
| Sincronización multi-dispositivo | Sin backend, solo export/import |
| Chat o funciones sociales | App personal, no social |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| *(populated during roadmap creation)* | | |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 0
- Unmapped: 46

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after initial definition*
