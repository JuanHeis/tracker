# Guía de interpretación — expense-tracker

Cómo leer la app sin descuadrarte mentalmente. Escrita para el dueño de los datos
(uso personal), no para devs. Última actualización: 2026-06-01.

---

## 1. Las dos preguntas que NO hay que mezclar

Toda la app gira alrededor de dos preguntas distintas. Si las confundís, todo parece
descuadrado aunque esté bien.

| Pregunta | Card | Qué mira |
|---|---|---|
| **¿Generé o quemé plata este mes?** | Resumen del Mes | **Flujo**: ingresos − gastos − aportes |
| **¿Cuánto tengo / cuánto cash para ejecutar ahora?** | PatrimonioCard | **Saldo**: todo lo acumulado |

- **Resumen del Mes = la película del mes.** ¿Cómo me fue en *este* período?
- **PatrimonioCard = la foto de hoy.** ¿Cuánto tengo en total, ahora mismo?

Prestar plata o comprar dólares **no** cambia tu patrimonio (la plata cambió de forma,
no se fue). Por eso esos movimientos **no** cuentan como "déficit" en Resumen del Mes.
Si querés ver cuántos pesos líquidos te quedan después de prestar/comprar dólares, eso
está en PatrimonioCard.

---

## 2. Resumen del Mes — renglón por renglón

**INGRESOS**
- **Ingreso fijo** — sueldo del mes (desde el historial salarial). Si dice "(ajuste)" es un override manual.
- **Otros ingresos** — extras del período en esa moneda.
- **Sobrante anterior** — el *resultado de flujo* del mes pasado. **No es "pesos en la cuenta"**;
  es "¿el mes pasado generé o quemé plata?". (Esto se corrigió en el quick 260601-otj: antes
  mezclaba préstamos y compra de dólares y generaba un déficit fantasma.)
- **Aguinaldo** — solo en julio y enero (empleo dependiente). Editable.

**EGRESOS**
- **Gastos** — todo lo gastado en el período (pagado o no).
- **Aportes inversión** — **solo** los aportes con purpose `ahorro` o `especulación`.
  Los `tarjeta` y `objetivo` son **neutros**: no aparecen acá porque no son un gasto,
  es plata que apartaste para un fin (ver sección 4).
- **Por pagar (ARS / USD)** — gastos marcados como NO pagados (`isPaid:false`).
  ⚠️ Ojo: incluye **cuotas futuras** que cargaste por adelantado.

**RESULTADO**
- **Disponible** = Sobrante anterior + Ingresos − Egresos.
  Cuánto te queda para mover *este mes*.
- **Resultado del mes** = Ingresos − Egresos (sin el sobrante).
  La señal pura: ¿este mes cerró en **verde** (generé) o **rojo** (quemé)?

> Los **retiros de inversión nunca suman** al Resultado del mes. Sacar plata de una
> inversión no es "ingreso del mes" — es mover patrimonio de un lado a otro.

---

## 3. Los banners de déficit

- **"Déficit anterior"** (ámbar) — el mes pasado cerró en rojo de flujo.
  Post-fix (260601-otj), solo se prende si *realmente* gastaste más de lo que entró,
  no por comprar dólares ni prestar.
- **"Déficit acumulado supera el umbral configurado"** (rojo) — alarma seria: venís
  quemando plata varios meses seguidos, o el déficit acumulado superó tu umbral
  (por defecto 10% del último sueldo). Mirá esto con atención.
- **"Venís en déficit N meses seguidos"** — variante del anterior cuando son 2+ meses
  consecutivos en rojo.

---

## 4. La trampa del `purpose` (feature de aportes)

Cada aporte a una inversión tiene un **propósito**:

| Purpose | ¿Cuenta como egreso del mes? |
|---|---|
| `ahorro` (default) | **SÍ** — resta del Resultado del mes |
| `especulacion` | **SÍ** — resta del Resultado del mes |
| `tarjeta` | **NO** — neutro |
| `objetivo` | **NO** — neutro |

**Cuidado al etiquetar:** cuando marcás un aporte como `tarjeta` u `objetivo`, ese monto
**desaparece** de "Egresos → Aportes inversión" y del Resultado del mes. Es a propósito
(esa plata no es gasto, la apartaste). Pero la primera vez que lo uses, verificá que el
Resultado siga teniendo sentido para vos — un aporte grande marcado neutro puede
"mejorar" el resultado de golpe y confundir.

Si no le ponés purpose a una inversión, todos sus aportes son `ahorro` por default
(o sea, **sí** restan).

---

## 5. PatrimonioCard — el "cuánto tengo ahora"

Acá vive el cash real para ejecutar:
- **Saldo líquido ARS / USD** (period y accumulated) — separados por moneda, no mezclados.
- **Inversiones** — patrimonio inmovilizado (no líquido).
- **Préstamos dados / Deudas** — lo que te deben / lo que debés.

Esta es la card que **sí** descuenta préstamos y conversiones a dólar del cash en pesos.
Si querés saber "cuántos pesos tengo para gastar ahora mismo", mirá el saldo líquido ARS acá,
NO el "Sobrante anterior" de Resumen del Mes.

---

## Regla mental de una línea

> **Resumen del Mes responde "¿cómo me fue este mes?" (flujo).
> PatrimonioCard responde "¿cuánto tengo ahora?" (saldo).
> Nunca esperes que un número de una conteste la pregunta de la otra.**
