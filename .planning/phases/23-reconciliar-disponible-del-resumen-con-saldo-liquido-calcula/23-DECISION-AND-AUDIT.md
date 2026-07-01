# Phase 23 — Decisión de semántica + Auditoría del cuadre

**Fecha:** 2026-07-01
**Contexto:** durante la ejecución se descubrió que el ancla de aceptación AC-1 ($28.168,76)
no era reproducible desde el backup real. Se consultó al dueño de los datos y se tomaron
decisiones que **superan** el criterio original.

---

## Decisión del usuario (autoritativa, supera AC-1)

### Semántica del "Disponible" → **Opción A: plata en mano exacta**
El Disponible del Resumen = saldo líquido crudo. Cuenta TODO lo que salió de la billetera,
incluidos:
- los aportes de inversión de **tarjeta/objetivo** (aunque en el Resultado del mes sigan
  siendo neutros por `purpose` — D2 intacto),
- el **préstamo del 30/06** (`presté`, −$333.334).

Consecuencia numérica (junio 2026 ARS, payDay=1):
- **Disponible junio = −$691.171,40** (flujo) / **−$702.501,30** (encadenado con mayo).
- **NO** $28.168,76. Ese valor asumía que solo faltaba la conversión de −$362.500 y que el
  préstamo se movía a julio; ambas premisas no se cumplen bajo la Opción A + payDay=1.

Esta es exactamente la implementación que dejaron los planes 23-01/02/03. **La ingeniería
ya coincide con la intención A.**

### Timing "mes vencido" → **payDay = 1 (sin cambios por ahora)**
El préstamo del 30/06 cuenta en junio. El alineamiento de `payDay` al día de cobro real se
pospone; queda como trabajo futuro separado.

### AC-1 revisado
> ~~Resumen ARS junio 2026 "Disponible" pasa a $28.168,76~~
> **Reemplazado:** Resumen ARS junio 2026 "Disponible" = **−$691.171,40** (flujo) /
> **−$702.501,30** (encadenado), = saldo líquido de `calculateDualBalances` menos el cuadre.
> El test de reconciliación (`lib/resumen/reconciliation.test.ts`) asERTA estos valores y pasa.

AC-2 (ambos motores reconcilian), AC-4 (sin schema/migración), AC-5 (cero-regresión del
saldo), AC-6 (test permanente) se mantienen y están verificados.

---

## Auditoría del cuadre `adjustment_ars` (~$4,1M) — read-only, sin cambios

### Qué es
Entrada creada por el usuario el **2026-06-30**:
- `adjustment_ars` = **+$4.111.230,13** — descripción: *"Cuadre saldo real ARS (periodo
  junio) - billetera 30/06"*.
- (aparte: seed del wizard 2026-04-02 = $360.834,74 *"Saldo inicial ARS (wizard)"*, y un
  `adjustment_usd` 2026-06-30 = −$25,13 *"Cuadre saldo real USD"*).

### Por qué existe (causa raíz)
La suma de los movimientos ARS cargados netea **mucho más negativo** que la billetera real,
así que el ajuste empareja. La causa estructural es el **modelo de acumulación del motor de
saldo**: acredita **un solo mes de sueldo** (el mes seleccionado) mientras **descuenta todos
los gastos/aportes/préstamos acumulados de todos los meses**. A medida que pasan los meses, el
sueldo entra una vez y los egresos se acumulan → el saldo tracked se va a negativo y se tapa
con el cuadre. No es un movimiento mal cargado puntual.

### Conclusión de la auditoría
- El cuadre **NO se vuelve redundante** por reconciliar los dos motores (la divergencia entre
  motores era ~$1.027.801 — conversión + préstamo + aportes de tarjeta —, no $4,1M).
- El $4,1M refleja un desfasaje real entre datos cargados y billetera, ligado al modelo de
  acumulación de sueldo (tema "mes-vencido").
- **Acción tomada: ninguna sobre los datos** (según indicación del usuario: "auditá nomás").
  Queda documentado para una eventual fase futura que revise el modelo de acumulación /
  timing de sueldo.

### AC-3 revisado
> ~~El adjustment_ars de cuadre deja de ser necesario~~
> **Corregido:** el cuadre NO es un artefacto de la divergencia entre motores; es un plug real
> ligado al modelo de acumulación de sueldo. El fix de esta fase lo **excluye correctamente**
> del `computeCashEffect` (no lo doble-cuenta), pero resolver el desfasaje de fondo es trabajo
> futuro, fuera de scope de esta fase (que es solo cálculo, sin tocar datos).
