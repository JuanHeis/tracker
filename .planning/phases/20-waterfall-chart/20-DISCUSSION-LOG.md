# Phase 20: Waterfall Chart - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 20-waterfall-chart
**Areas discussed:** Diseno visual del waterfall, Desglose por subcategoria, Interactividad del chart, Seleccion de mes

---

## Diseno visual del waterfall

### Orientacion de barras

| Option | Description | Selected |
|--------|-------------|----------|
| Barras verticales | Clasico waterfall chart: barras verticales de izquierda a derecha. Consistente con otros Recharts charts existentes | ✓ |
| Barras horizontales | Barras horizontales apiladas de arriba a abajo. Mas compacto verticalmente | |

**User's choice:** Barras verticales (Recomendado)
**Notes:** Consistencia con charts existentes fue factor clave

### Esquema de colores

| Option | Description | Selected |
|--------|-------------|----------|
| Semantico financiero | Verde ingresos, rojo/naranja gastos, azul inversiones, esmeralda libre. Consistente con CARD-05 | ✓ |
| Gradiente de un solo tono | Un solo color con tonos oscuro a claro. Mas minimalista | |
| Tu decides | Claude elige la paleta | |

**User's choice:** Semantico financiero (Recomendado)
**Notes:** Alineado con convencion CARD-05 existente

### Conectores entre barras

| Option | Description | Selected |
|--------|-------------|----------|
| Sin conectores | Barras flotantes con rango [start, end]. Limpio y moderno | ✓ |
| Lineas punteadas | Lineas horizontales punteadas entre barras. Mas explicito | |
| Tu decides | Claude elige segun dark theme | |

**User's choice:** Sin conectores (Recomendado)
**Notes:** Patron range-value ya decidido en ROADMAP

---

## Desglose por subcategoria

### Tipo de desglose

| Option | Description | Selected |
|--------|-------------|----------|
| Tooltip al hover | Tooltip con lista de subcategorias. Patron ya usado en PatrimonyChart | ✓ |
| Barras apiladas | Sub-barras dentro de cada segmento. Visualmente denso | |
| Click para expandir | Panel debajo del chart con lista detallada | |

**User's choice:** Tooltip al hover (Recomendado)
**Notes:** Consistencia con charts existentes

### Limite de subcategorias

| Option | Description | Selected |
|--------|-------------|----------|
| Top 5 + 'Otros' | 5 subcategorias mayores, resto agrupado. Tooltip legible | ✓ |
| Mostrar todos | Sin limite. Completo pero potencialmente largo | |
| Tu decides | Claude elige el limite | |

**User's choice:** Top 5 + 'Otros' (Recomendado)
**Notes:** Mantiene tooltips legibles

---

## Interactividad del chart

| Option | Description | Selected |
|--------|-------------|----------|
| Solo tooltips | Hover muestra tooltip, nada mas. Consistente con otros charts | |
| Tooltips + animacion de entrada | Tooltips + barras crecen de 0 al valor final al cargar | ✓ |
| Tooltips + labels permanentes | Tooltips + monto total siempre visible en cada barra | |

**User's choice:** Tooltips + animacion de entrada
**Notes:** Agrega efecto visual al cargar sin complicar la interaccion

---

## Seleccion de mes

| Option | Description | Selected |
|--------|-------------|----------|
| Usa mes seleccionado global | Reutiliza selectedMonth/selectedYear existente. Cero UI adicional | ✓ |
| Selector de mes propio | Dropdown independiente del selector global | |
| Siempre mes actual | Hardcodeado al mes corriente, sin cambio posible | |

**User's choice:** Usa el mes seleccionado global (Recomendado)
**Notes:** Reutiliza infraestructura existente sin agregar UI

---

## Claude's Discretion

- Exact color hex values for each segment
- Tooltip styling and formatting
- Animation duration and easing
- Empty segment handling
- Bar width and spacing

## Deferred Ideas

None — discussion stayed within phase scope.
