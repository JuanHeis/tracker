# Requirements: Expense Tracker — Contador Personal

**Defined:** 2026-04-01
**Core Value:** Reflejar la realidad financiera exacta del usuario en todo momento — nunca perderse un peso ni un dolar.

## v1 Requirements

### Bug Fixes

- [x] **BUG-01**: Fix inversiones que siempre se guardan como ARS ignorando moneda original
- [x] **BUG-02**: Fix tipos de inversion que no coinciden entre dialog ("FCI","PlazoFijo","Crypto") y types ("Plazo Fijo","Bonos")
- [x] **BUG-03**: Fix calculateTotalAvailable() que suma todo sin filtrar por mes ni estado de inversion
- [x] **BUG-04**: Fix division por cero cuando usdRate es 0 (muestra Infinity/NaN)
- [x] **BUG-05**: Fix fechas de cuotas que se corrompen (gasto 31/01 con 3 cuotas -> cuota 3 cae 28/03 en vez de 31/03)
- [x] **BUG-06**: Fix campo de cuotas deshabilitado al editar un gasto existente
- [x] **BUG-07**: Fix formulario de sueldo que no pre-carga valores actuales al editar

### Inversiones

- [x] **INV-01**: User puede crear inversion como cuenta con nombre, tipo, moneda base y status
- [x] **INV-02**: User puede registrar aportes (movements positivos) que restan del liquido del mes
- [x] **INV-03**: User puede registrar retiros (movements negativos) que vuelven al liquido del mes
- [x] **INV-04**: User puede actualizar el valor actual de una inversion inline (sin modal)
- [x] **INV-05**: User puede finalizar inversion (retiro total automatico + status Finalizada + currentValue 0)
- [x] **INV-06**: User ve ganancia/perdida y rendimiento % por cada inversion (currentValue vs total invertido)
- [x] **INV-07**: User ve aviso "valor desactualizado" si lastUpdated > 7 dias
- [x] **INV-08**: Plazo Fijo auto-calcula valor actual segun tasa y dias transcurridos (solo ARS)
- [x] **INV-09**: Crypto siempre en USD, FCI en ARS o USD segun eleccion, Acciones segun mercado
- [x] **INV-10**: Tabla de inversiones muestra: nombre, tipo, capital invertido, valor actual, ganancia, %, ultima actualizacion, acciones

### Moneda Dual

- [x] **MON-01**: User tiene saldos reales separados en ARS y USD (no solo conversion visual)
- [x] **MON-02**: Cada transaccion guarda la cotizacion USD del momento en que se registro
- [x] **MON-03**: User puede configurar cotizacion global actual para calcular patrimonio total en ARS
- [x] **MON-04**: User puede comprar USD desde saldo ARS (resta ARS, suma USD, patrimonio no cambia)
- [x] **MON-05**: User puede registrar USD de efectivo no trackeado (suma USD sin restar ARS, con origen explicito)
- [x] **MON-06**: User ve ganancia/perdida cambiaria automatica (cotizacion de compra vs global actual)
- [ ] **MON-07**: User puede editar cotizacion USD retroactivamente si la cargo mal
- [x] **MON-08**: Validacion: cotizacion USD siempre > 0, monto siempre > 0

### Ingresos y Fecha de Cobro

- [ ] **ING-01**: Terminologia renombrada: "Salario" -> "Ingreso fijo", "Ingresos extras" -> "Otros ingresos"
- [ ] **ING-02**: User puede configurar fecha de cobro del ingreso fijo (ej: dia 10)
- [ ] **ING-03**: User puede ver vista "periodo personalizado" (del dia de cobro al dia anterior del mes siguiente)
- [ ] **ING-04**: User puede ver vista "mes calendario" con indicador "Pendiente de cobro" antes de la fecha
- [ ] **ING-05**: User puede alternar entre ambas vistas segun preferencia
- [ ] **ING-06**: Aumento de sueldo afecta al mes corriente y a los siguientes
- [ ] **ING-07**: Aguinaldo auto-calculado para relacion de dependencia (50% mejor sueldo del semestre, junio/diciembre)
- [ ] **ING-08**: User puede indicar si es dependiente o independiente; aguinaldo oculto para independientes

### Card Mensual

- [ ] **CARD-01**: Resumen mensual con desglose claro: Ingresos (fijo + otros) / Egresos (gastos + aportes inversiones) / Disponible
- [ ] **CARD-02**: Separacion visual explicita "Este mes" vs "Historico (todos los meses)" con etiquetas y colores distintos
- [ ] **CARD-03**: Patrimonio total = Dinero liquido ARS + Dinero liquido USD (convertido) + sum currentValue inversiones activas
- [ ] **CARD-04**: Cada numero muestra tooltip o desglose de como se calcula
- [ ] **CARD-05**: Colores semanticos: verde ingresos, rojo egresos, azul inversiones

### Gastos Recurrentes

- [ ] **REC-01**: User puede definir gasto recurrente (nombre, monto, categoria, frecuencia mensual)
- [ ] **REC-02**: Gastos recurrentes se auto-generan cada mes
- [ ] **REC-03**: User puede pausar o cancelar un gasto recurrente
- [ ] **REC-04**: User puede marcar gasto recurrente como pagado cada mes

### Prestamos

- [ ] **PREST-01**: User puede registrar "le preste $X a [persona]" con fecha y monto
- [ ] **PREST-02**: User puede registrar "debo $X a [persona]" con fecha y monto
- [ ] **PREST-03**: Prestamo dado cuenta como activo, deuda cuenta como pasivo en patrimonio
- [ ] **PREST-04**: User puede marcar prestamo como cobrado (vuelve al liquido) o deuda como pagada (sale del liquido)

### Presupuestos

- [ ] **PRES-01**: User puede definir tope mensual por categoria de gasto
- [ ] **PRES-02**: User ve barra de progreso visual del gasto vs presupuesto por categoria
- [ ] **PRES-03**: User ve alerta visual al acercarse al limite del presupuesto

### Transferencias

- [ ] **TRANS-01**: User puede registrar transferencia entre cuentas propias (banco a MP, ARS a USD)
- [ ] **TRANS-02**: Transferencia no afecta patrimonio — solo cambia donde esta la plata

### Ajustes y Persistencia

- [ ] **AJUST-01**: User puede "Ajustar saldo real" — crea ingreso/gasto de ajuste automatico para cuadrar con realidad
- [ ] **PERS-01**: User puede exportar todos los datos a archivo JSON
- [ ] **PERS-02**: User puede importar datos desde archivo JSON con validacion

### UX General

- [ ] **UX-01**: Terminologia estandar de finanzas personales en toda la app (patrimonio, liquido, etc.)
- [ ] **UX-02**: Formularios validan monto > 0 y cotizacion USD > 0

## v2 Requirements

### Tarjetas de Credito

- **TC-01**: Tarjetas como entidad (nombre, banco, fecha cierre, fecha vencimiento)
- **TC-02**: Gastos en cuotas asociados a tarjeta especifica
- **TC-03**: Fecha de cobro de cada cuota segun cierre/vencimiento de la tarjeta
- **TC-04**: Vista de resumen por tarjeta (cuanto debes este mes, proximo, total)

### Inflacion

- **IPC-01**: Ajuste por IPC para comparar valores entre meses en pesos constantes
- **IPC-02**: Mostrar "equivale a $X de hoy" en valores historicos

### Cuentas Multiples

- **CTA-01**: Definir cuentas (Banco X, Banco Y, MP, efectivo)
- **CTA-02**: Cada transaccion asociada a una cuenta
- **CTA-03**: Ver saldo por cuenta individual + total consolidado

## Out of Scope

| Feature | Reason |
|---------|--------|
| Conexion automatica a bancos/brokers | Complejidad y seguridad, actualizacion manual suficiente |
| Mobile app nativa | Web-first responsive, no justifica app nativa |
| OAuth / login | App local sin usuarios, no necesita autenticacion |
| Calculo automatico de impuestos | Demasiado complejo, varia por situacion fiscal |
| Sincronizacion multi-dispositivo | Sin backend, solo export/import |
| Chat o funciones sociales | App personal, no social |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BUG-01 | Phase 1 | Complete |
| BUG-02 | Phase 1 | Complete |
| BUG-03 | Phase 1 | Complete |
| BUG-04 | Phase 1 | Complete |
| BUG-05 | Phase 1 | Complete |
| BUG-06 | Phase 1 | Complete |
| BUG-07 | Phase 1 | Complete |
| INV-01 | Phase 2 | Complete |
| INV-02 | Phase 2 | Complete |
| INV-03 | Phase 2 | Complete |
| INV-04 | Phase 2 | Complete |
| INV-05 | Phase 2 | Complete |
| INV-06 | Phase 2 | Complete |
| INV-07 | Phase 2 | Complete |
| INV-08 | Phase 2 | Complete |
| INV-09 | Phase 2 | Complete |
| INV-10 | Phase 2 | Complete |
| MON-01 | Phase 3 | Complete |
| MON-02 | Phase 3 | Complete |
| MON-03 | Phase 3 | Complete |
| MON-04 | Phase 3 | Complete |
| MON-05 | Phase 3 | Complete |
| MON-06 | Phase 3 | Complete |
| MON-07 | Phase 3 | Pending |
| MON-08 | Phase 3 | Complete |
| ING-01 | Phase 4 | Pending |
| ING-02 | Phase 4 | Pending |
| ING-03 | Phase 4 | Pending |
| ING-04 | Phase 4 | Pending |
| ING-05 | Phase 4 | Pending |
| ING-06 | Phase 4 | Pending |
| ING-07 | Phase 4 | Pending |
| ING-08 | Phase 4 | Pending |
| CARD-01 | Phase 5 | Pending |
| CARD-02 | Phase 5 | Pending |
| CARD-03 | Phase 5 | Pending |
| CARD-04 | Phase 5 | Pending |
| CARD-05 | Phase 5 | Pending |
| REC-01 | Phase 6 | Pending |
| REC-02 | Phase 6 | Pending |
| REC-03 | Phase 6 | Pending |
| REC-04 | Phase 6 | Pending |
| PREST-01 | Phase 7 | Pending |
| PREST-02 | Phase 7 | Pending |
| PREST-03 | Phase 7 | Pending |
| PREST-04 | Phase 7 | Pending |
| PRES-01 | Phase 8 | Pending |
| PRES-02 | Phase 8 | Pending |
| PRES-03 | Phase 8 | Pending |
| TRANS-01 | Phase 9 | Pending |
| TRANS-02 | Phase 9 | Pending |
| AJUST-01 | Phase 9 | Pending |
| PERS-01 | Phase 10 | Pending |
| PERS-02 | Phase 10 | Pending |
| UX-01 | Phase 10 | Pending |
| UX-02 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after roadmap creation*
