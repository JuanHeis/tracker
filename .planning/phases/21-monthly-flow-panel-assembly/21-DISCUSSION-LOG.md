# Phase 21: Monthly Flow Panel Assembly - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-11
**Phase:** 21-monthly-flow-panel-assembly
**Areas discussed:** Ubicacion en la app, Layout del panel, Mini-proyeccion inline, Simulacion inline

---

## Ubicacion en la app

### Donde se ubica el panel

| Option | Description | Selected |
|--------|-------------|----------|
| Nuevo tab 'Flujo Mensual' | Agregar tab nuevo en barra inferior. Tab 9 | |
| Dentro del tab 'Charts' | Seccion adicional dentro de ChartsContainer | |
| Reemplazar tab 'Charts' | Panel reemplaza tab charts actual | |
| **Other: Reemplaza ResumenCard** | El panel ocupa el lugar del ResumenCard en la vista principal | ✓ |

**User's choice:** Reemplaza la Card resumen del mes (ResumenCard). No es un tab nuevo — ocupa el espacio de ResumenCard en la vista principal.
**Notes:** Confirmado en follow-up: SI reemplaza ResumenCard, no es un tab nuevo.

### SavingsRateSelector

| Option | Description | Selected |
|--------|-------------|----------|
| Mover al panel, quitar del sidebar | Selector vive solo dentro del panel. Se quita del sidebar | ✓ |
| Mantener en ambos lados | Selector en sidebar Y en panel (dos instancias) | |
| Tu decides | Claude elige | |

**User's choice:** Mover al panel, quitar del sidebar (Recomendado)
**Notes:** Evita duplicacion, contexto natural junto al waterfall

---

## Layout del panel

| Option | Description | Selected |
|--------|-------------|----------|
| Stack vertical completo | Todo apilado: waterfall, savings rate, mini-proyeccion, simulacion | ✓ |
| Dos columnas | Charts izquierda, controles derecha | |
| Tu decides | Claude elige | |

**User's choice:** Stack vertical completo (Recomendado)
**Notes:** Simple, responsive, similar a cards actuales

---

## Mini-proyeccion inline

| Option | Description | Selected |
|--------|-------------|----------|
| Chart simplificado con 3 escenarios | LineChart compacto ~150px, 3 lineas escenario a 12 meses | ✓ |
| Solo numeros sin chart | Tres valores de texto pesimista/base/optimista | |
| Chart completo tipo PatrimonyChart | Reutilizar PatrimonyChart con historico + proyeccion | |

**User's choice:** Chart simplificado con 3 escenarios (Recomendado)
**Notes:** Similar al mini chart del SimulatorDialog

---

## Simulacion inline

| Option | Description | Selected |
|--------|-------------|----------|
| Campo simple: monto mensual | Un input numerico para gasto hipotetico mensual en ARS. Waterfall y proyeccion se actualizan en tiempo real | ✓ |
| Mini-form con nombre y monto | Input nombre + monto + boton agregar + lista | |
| Solo boton al SimulatorDialog | Sin simulacion inline, boton abre SimulatorDialog | |

**User's choice:** Campo simple: monto mensual (Recomendado)
**Notes:** Para simulacion rapida. El SimulatorDialog completo ya existe para detalle.

---

## Claude's Discretion

- Section spacing and visual separation
- Empty state handling (no salary, no data)
- Panel header/title
- Mini-projection line colors and opacity
- Impact text format (percentage vs absolute)

## Deferred Ideas

None — discussion stayed within phase scope.
