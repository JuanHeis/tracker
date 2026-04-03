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
- [x] **MON-07**: User puede editar cotizacion USD retroactivamente si la cargo mal
- [x] **MON-08**: Validacion: cotizacion USD siempre > 0, monto siempre > 0

### Ingresos y Fecha de Cobro

- [x] **ING-01**: Terminologia renombrada: "Salario" -> "Ingreso fijo", "Ingresos extras" -> "Otros ingresos"
- [x] **ING-02**: User puede configurar fecha de cobro del ingreso fijo (ej: dia 10)
- [x] **ING-03**: User puede ver vista "periodo personalizado" (del dia de cobro al dia anterior del mes siguiente)
- [x] **ING-04**: User puede ver vista "mes calendario" con indicador "Pendiente de cobro" antes de la fecha
- [x] **ING-05**: User puede alternar entre ambas vistas segun preferencia
- [x] **ING-06**: Aumento de sueldo afecta al mes corriente y a los siguientes
- [x] **ING-07**: Aguinaldo auto-calculado para relacion de dependencia (50% mejor sueldo del semestre, junio/diciembre)
- [x] **ING-08**: User puede indicar si es dependiente o independiente; aguinaldo oculto para independientes

### Card Mensual

- [x] **CARD-01**: Resumen mensual con desglose claro: Ingresos (fijo + otros) / Egresos (gastos + aportes inversiones) / Disponible
- [x] **CARD-02**: Separacion visual explicita "Este mes" vs "Historico (todos los meses)" con etiquetas y colores distintos
- [x] **CARD-03**: Patrimonio total = Dinero liquido ARS + Dinero liquido USD (convertido) + sum currentValue inversiones activas
- [x] **CARD-04**: Cada numero muestra tooltip o desglose de como se calcula
- [x] **CARD-05**: Colores semanticos: verde ingresos, rojo egresos, azul inversiones

### Gastos Recurrentes

- [x] **REC-01**: User puede definir gasto recurrente (nombre, monto, categoria, frecuencia mensual)
- [x] **REC-02**: Gastos recurrentes se auto-generan cada mes
- [x] **REC-03**: User puede pausar o cancelar un gasto recurrente
- [x] **REC-04**: User puede marcar gasto recurrente como pagado cada mes

### Prestamos

- [x] **PREST-01**: User puede registrar "le preste $X a [persona]" con fecha y monto
- [x] **PREST-02**: User puede registrar "debo $X a [persona]" con fecha y monto
- [x] **PREST-03**: Prestamo dado cuenta como activo, deuda cuenta como pasivo en patrimonio
- [x] **PREST-04**: User puede marcar prestamo como cobrado (vuelve al liquido) o deuda como pagada (sale del liquido)

### Presupuestos

- [x] **PRES-01**: User puede definir tope mensual por categoria de gasto
- [x] **PRES-02**: User ve barra de progreso visual del gasto vs presupuesto por categoria
- [x] **PRES-03**: User ve alerta visual al acercarse al limite del presupuesto

### Transferencias

- [x] **TRANS-01**: User puede registrar transferencia entre cuentas propias (banco a MP, ARS a USD)
- [x] **TRANS-02**: Transferencia no afecta patrimonio — solo cambia donde esta la plata

### Ajustes y Persistencia

- [x] **AJUST-01**: User puede "Ajustar saldo real" — crea ingreso/gasto de ajuste automatico para cuadrar con realidad
- [x] **PERS-01**: User puede exportar todos los datos a archivo JSON
- [x] **PERS-02**: User puede importar datos desde archivo JSON con validacion

### UX General

- [x] **UX-01**: Terminologia estandar de finanzas personales en toda la app (patrimonio, liquido, etc.)
- [x] **UX-02**: Formularios validan monto > 0 y cotizacion USD > 0

## v1.1 Requirements

### Setup Wizard

- [x] **WIZ-01**: User ve wizard automaticamente al abrir la app por primera vez (sin datos en localStorage)
- [x] **WIZ-02**: User puede cargar saldo liquido ARS actual en el wizard
- [x] **WIZ-03**: User puede cargar saldo USD + cotizacion actual en el wizard
- [x] **WIZ-04**: User puede cargar ingreso fijo (sueldo, tipo empleo, dia de cobro) en el wizard
- [x] **WIZ-05**: User puede cargar inversiones existentes una por una (tipo, nombre, monto, moneda) con loop "agregar otra"
- [x] **WIZ-06**: User ve resumen de todo lo cargado y confirma antes de guardar
- [x] **WIZ-07**: Wizard guarda todos los datos de forma atomica (todo o nada) al confirmar
- [x] **WIZ-08**: User puede saltar pasos opcionales (USD, ingreso, inversiones) y completarlos despues
- [x] **WIZ-09**: Wizard ofrece importar JSON existente como alternativa en la pantalla de bienvenida
- [x] **WIZ-10**: User puede re-ejecutar wizard desde Configuracion (reset de fabrica + wizard)

### Manual de Uso

- [x] **MAN-01**: Existe un MANUAL.md con guia paso a paso de como usar cada feature de la app

## v1.2 Requirements

### Motor de Proyeccion

- [x] **PROJ-01**: User ve proyeccion de cada inversion activa con interes compuesto (PF usa TNA, otras usan rendimiento observado)
- [x] **PROJ-02**: User puede activar "aportes futuros" por inversion — proyecta aportes mensuales recurrentes (por default: monto del ultimo aporte)
- [x] **PROJ-03**: User ve proyeccion lineal de ingresos futuros basada en su ingreso fijo actual
- [x] **PROJ-04**: Proyeccion de patrimonio deduce gastos recurrentes del ahorro mensual neto
- [x] **PROJ-05**: User ve patrimonio historico reconstruido mes a mes desde monthlyData en linea solida

### Charts UI

- [x] **CHART-01**: User ve grafico de patrimonio combinado: linea solida (historico) + linea punteada (proyeccion) + linea "Hoy"
- [ ] **CHART-02**: User ve grafico de inversiones con proyeccion del portafolio (agregado, con desglose por tipo)
- [x] **CHART-03**: User ve 3 escenarios visuales (optimista/base/pesimista) con diferentes opacidades
- [x] **CHART-04**: User puede seleccionar horizonte de proyeccion (3, 6, 12, 24 meses) y togglear escenarios on/off
- [x] **CHART-05**: Todos los graficos combinan ARS+USD a cotizacion actual con disclaimer visible

### Infraestructura Charts

- [x] **INFRA-01**: Recharts actualizado a v3.x con charts existentes verificados post-upgrade
- [x] **INFRA-02**: Todos los charts usan patron "use client" + useHydration + ChartContainer existente
- [x] **INFRA-03**: Cero cambios a interfaces existentes de localStorage (MonthlyData, Investment, etc.) — charts son read-only

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
| Monte Carlo / ML predictions | Overkill para tracker personal, compound interest es suficiente |
| Proyeccion de tipo de cambio futuro | Imposible de predecir en Argentina, usar cotizacion actual |
| Inflacion en proyecciones | Sin fuente confiable de IPC, valores nominales con disclaimer |
| Editor custom de parametros de escenarios | Demasiado complejo, escenarios predefinidos suficientes |
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
| MON-07 | Phase 3 | Complete |
| MON-08 | Phase 3 | Complete |
| ING-01 | Phase 4 | Complete |
| ING-02 | Phase 4 | Complete |
| ING-03 | Phase 4 | Complete |
| ING-04 | Phase 4 | Complete |
| ING-05 | Phase 4 | Complete |
| ING-06 | Phase 4 | Complete |
| ING-07 | Phase 4 | Complete |
| ING-08 | Phase 4 | Complete |
| CARD-01 | Phase 5 | Complete |
| CARD-02 | Phase 5 | Complete |
| CARD-03 | Phase 5 | Complete |
| CARD-04 | Phase 5 | Complete |
| CARD-05 | Phase 5 | Complete |
| REC-01 | Phase 6 | Complete |
| REC-02 | Phase 6 | Complete |
| REC-03 | Phase 6 | Complete |
| REC-04 | Phase 6 | Complete |
| PREST-01 | Phase 7 | Complete |
| PREST-02 | Phase 7 | Complete |
| PREST-03 | Phase 7 | Complete |
| PREST-04 | Phase 7 | Complete |
| PRES-01 | Phase 8 | Complete |
| PRES-02 | Phase 8 | Complete |
| PRES-03 | Phase 8 | Complete |
| TRANS-01 | Phase 9 | Complete |
| TRANS-02 | Phase 9 | Complete |
| AJUST-01 | Phase 9 | Complete |
| PERS-01 | Phase 10 | Complete |
| PERS-02 | Phase 10 | Complete |
| UX-01 | Phase 10 | Complete |
| UX-02 | Phase 10 | Complete |
| WIZ-01 | Phase 11 | Complete |
| WIZ-02 | Phase 11 | Complete |
| WIZ-03 | Phase 11 | Complete |
| WIZ-04 | Phase 11 | Complete |
| WIZ-05 | Phase 12 | Complete |
| WIZ-06 | Phase 11 | Complete |
| WIZ-07 | Phase 11 | Complete |
| WIZ-08 | Phase 11 | Complete |
| WIZ-09 | Phase 11 | Complete |
| WIZ-10 | Phase 12 | Complete |
| MAN-01 | Phase 13 | Complete |
| INFRA-01 | Phase 14 | Complete |
| INFRA-02 | Phase 14 | Complete |
| INFRA-03 | Phase 14 | Complete |
| PROJ-01 | Phase 15 | Complete |
| PROJ-02 | Phase 15 | Complete |
| PROJ-03 | Phase 15 | Complete |
| PROJ-04 | Phase 15 | Complete |
| PROJ-05 | Phase 15 | Complete |
| CHART-01 | Phase 16 | Complete |
| CHART-02 | Phase 16 | Pending |
| CHART-03 | Phase 16 | Complete |
| CHART-04 | Phase 16 | Complete |
| CHART-05 | Phase 16 | Complete |

**Coverage:**
- v1 requirements: 46 total — all complete
- v1.1 requirements: 11 total — all complete
- v1.2 requirements: 13 total — all mapped to phases 14-16
- Mapped to phases: 57 (v1+v1.1) complete + 13 (v1.2) pending = 70 total
- Unmapped: 0

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-03 — v1.2 requirements mapped to phases 14-16*
