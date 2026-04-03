# Manual de Uso — Contador Personal

## Introduccion

Contador Personal es una aplicacion de finanzas personales disenada para **reflejar tu realidad financiera exacta en todo momento**. Registra gastos, ingresos, inversiones, prestamos y presupuestos con soporte completo para doble moneda (ARS y USD).

Todos los datos se almacenan localmente en tu navegador (localStorage). No hay servidor ni cuentas de usuario — tus datos son tuyos. Podes exportarlos como archivo JSON en cualquier momento desde Configuracion.

---

## Primer Uso: Setup Wizard

Al abrir la app por primera vez (sin datos previos), se muestra automaticamente el asistente de configuracion inicial.

### Paso 0 — Bienvenida

Presenta dos opciones:

1. **Configurar desde cero** — Inicia el wizard paso a paso para cargar tus datos iniciales.
2. **Importar backup existente** — Subi un archivo JSON exportado previamente. Si el archivo es valido, se cargan todos los datos y se recarga la app.

### Paso 1 — Saldo ARS

1. Ingresa tu **saldo liquido en ARS** (el efectivo y dinero en cuentas bancarias que tenes disponible hoy).
2. Presiona **Siguiente** para continuar.

### Paso 2 — Saldo USD

1. Ingresa tu **saldo en USD** (dolares fisicos o en cuentas).
2. Ingresa la **cotizacion USD** actual (cuantos pesos vale un dolar).
3. Presiona **Siguiente** para continuar.

> **Nota:** Este paso es opcional. Si no tenes dolares, presiona **Omitir** para saltar al siguiente paso.

### Paso 3 — Ingreso Fijo

1. Ingresa el monto de tu **ingreso fijo** mensual.
2. Selecciona el **tipo de empleo**: **Dependiente** o **Independiente**.
3. Ingresa tu **dia de cobro** (dia del mes en que cobras).
4. Presiona **Siguiente** para continuar.

> **Nota:** Este paso es opcional. Si no tenes un ingreso fijo regular, presiona **Omitir**. Podes configurarlo mas tarde desde Configuracion.

### Paso 4 — Inversiones

1. Presiona **Agregar inversion** para cargar una inversion existente.
2. Completa los campos: **tipo** (FCI, Plazo Fijo, Crypto, Acciones), **nombre**, **monto invertido**, **moneda**.
3. Repeti el proceso para agregar mas inversiones.
4. Presiona **Siguiente** cuando hayas terminado.

> **Nota:** Este paso es opcional. Presiona **Omitir** si no tenes inversiones o preferis cargarlas despues. La moneda se fuerza automaticamente segun el tipo: Crypto siempre usa USD, Plazo Fijo siempre usa ARS.

### Paso 5 — Resumen

1. Revisa todos los datos ingresados en los pasos anteriores.
2. Si algo esta mal, volve al paso correspondiente para corregirlo.
3. Presiona **Confirmar** para guardar todos los datos de forma atomica.

> **Nota:** El borrador del wizard se guarda en sessionStorage mientras avanzas. Si cerras la pestana, se pierde el progreso y tendras que empezar de nuevo. Los datos solo se guardan definitivamente al confirmar en este paso.

---

## Pantalla Principal

### Resumen del Mes

La tarjeta superior muestra un resumen financiero del mes seleccionado:

- **Ingreso fijo** — Tu ingreso fijo mensual configurado.
- **Otros ingresos** — Ingresos adicionales cargados en el mes.
- **Aguinaldo** — Calculado automaticamente para tipo dependiente (ver seccion Ingresos).
- **Total gastos** — Suma de todos los gastos del mes.
- **Aportes inversiones** — Dinero destinado a inversiones en el mes.
- **Disponible** — Lo que queda despues de gastos y aportes.

### Patrimonio Total

Muestra tu patrimonio completo:

- **Liquido ARS** — Efectivo y cuentas en pesos.
- **Liquido USD** — Dolares convertidos a ARS usando la **cotizacion USD** global.
- **Inversiones** — Suma del valor actual de todas las inversiones activas.

El patrimonio total es la suma de estos tres componentes.

### Tarjeta de Configuracion

Acceso rapido a los ajustes principales. Los detalles completos estan en la seccion Configuracion de este manual.

### Selector de Mes/Ano y Modo de Vista

- Usa el selector de **mes y ano** para navegar entre periodos.
- Alterna entre dos modos de vista:
  - **Periodo** — Desde tu dia de cobro hasta el siguiente dia de cobro.
  - **Mes** — Mes calendario (1 al 30/31).

### Barra de Navegacion

En la parte inferior hay una barra flotante con 8 pestanas: **Gastos**, **Ingresos**, **Inversiones**, **Charts**, **Movimientos**, **Recurrentes**, **Presupuestos** y **Prestamos**. Presiona cualquier pestana para cambiar de seccion.

---

## Gastos

Registra y gestiona tus gastos diarios.

### Agregar un gasto

1. Presiona el boton de agregar en la seccion Gastos.
2. Completa los campos:
   - **Descripcion** — Que compraste o pagaste.
   - **Monto** — Cuanto gastaste.
   - **Categoria** — Selecciona una categoria (Alimentacion, Transporte, Entretenimiento, etc.).
   - **Fecha** — Cuando fue el gasto.
3. Confirma para guardar.

### Gastos en cuotas

Si un gasto se paga en cuotas (por ejemplo, una compra con tarjeta en 12 cuotas):

1. Al agregar el gasto, activa la opcion de **cuotas**.
2. Ingresa la **cantidad de cuotas**.
3. La app divide el monto total entre las cuotas y distribuye automaticamente un gasto por mes a partir de la fecha seleccionada.

> **Nota:** Cada cuota se registra como un gasto individual en el mes correspondiente. Si eliminas el gasto original, se eliminan todas las cuotas futuras.

### Editar o eliminar un gasto

- Presiona sobre un gasto existente para editarlo.
- Usa la opcion de eliminar para borrarlo.

---

## Ingresos

Gestiona todas tus fuentes de ingreso.

### Ingreso fijo

Tu ingreso fijo mensual se configura en la seccion **Configuracion** (tipo de empleo, monto, dia de cobro). Aparece automaticamente en el resumen de cada mes.

- Si tu dia de cobro aun no llego en el mes actual, veras el indicador **"Pendiente de cobro"**.

### Otros ingresos

Para ingresos adicionales que no son tu ingreso fijo:

1. Presiona **Agregar** en la seccion Ingresos.
2. Ingresa la **descripcion** y el **monto**.
3. Confirma para guardar.

Estos ingresos se suman al total mensual junto con el ingreso fijo.

### Aguinaldo

Si tu tipo de empleo es **Dependiente**, la app calcula automaticamente el aguinaldo:

- Se genera en **junio** y **diciembre**.
- El monto es el **50% del mejor ingreso fijo del semestre** correspondiente.
- Si tu tipo de empleo es **Independiente**, no se calcula aguinaldo.

### Modos de vista

- **Periodo** — Muestra los ingresos desde tu dia de cobro hasta el siguiente dia de cobro. Util para ver cuanto ganaste en un "ciclo de cobro".
- **Mes** — Muestra los ingresos del mes calendario (del 1 al 30/31).

---

## Inversiones

Administra tus cuentas de inversion y segui su rendimiento.

### Crear una inversion

1. Presiona **Agregar inversion**.
2. Completa los campos:
   - **Nombre** — Nombre descriptivo (ej: "FCI Balanz", "Plazo Fijo Galicia").
   - **Tipo** — FCI, Plazo Fijo, Crypto o Acciones.
   - **Moneda base** — ARS o USD.
3. Confirma para crear la cuenta.

> **Nota:** La moneda se fuerza segun el tipo: **Crypto** siempre opera en USD, **Plazo Fijo** siempre opera en ARS. Para FCI y Acciones podes elegir la moneda.

### Registrar aportes y retiros

- **Aportes** — Agrega dinero a la inversion. El monto se resta de tu **Liquido** correspondiente (ARS o USD).
- **Retiros** — Retira dinero de la inversion. El monto se suma a tu **Liquido** correspondiente.

### Actualizar valor actual

1. Presiona sobre el campo de **valor actual** de la inversion.
2. Ingresa el nuevo valor de mercado.
3. La app calcula automaticamente el **rendimiento %** y la **ganancia/perdida**.

> **Nota:** Si pasan mas de 7 dias sin actualizar el valor, aparece una advertencia de **"Valor desactualizado"**.

> **Nota:** Para **Plazo Fijo**, el valor actual se calcula automaticamente usando la tasa de interes y los dias transcurridos desde el inicio.

### Finalizar una inversion

1. Presiona **Finalizar** en la inversion que quieras cerrar.
2. Se ejecuta automaticamente un retiro total por el valor actual.
3. El dinero vuelve a tu Liquido y la inversion cambia a estado finalizada.

---

## Charts

Visualiza tus finanzas con graficos comparativos.

### Gastos por Mes

Muestra un grafico de barras comparando tus gastos totales mes a mes durante el ano seleccionado. Util para identificar meses de mayor gasto.

### Ingreso Fijo por Mes

Muestra un grafico comparando tu ingreso fijo mes a mes durante el ano seleccionado. Permite ver la evolucion de tu ingreso a lo largo del tiempo.

Ambos graficos se filtran por el **ano** seleccionado en el selector superior.

---

## Movimientos y Transferencias

Gestiona movimientos de dinero entre tus propias cuentas y ajustes de saldo.

### Transferencia entre cuentas

1. Selecciona la cuenta de **origen** y la cuenta de **destino**.
2. Ingresa el **monto** a transferir.
3. Confirma la transferencia.

> **Nota:** Las transferencias entre cuentas propias no modifican tu **Patrimonio Total** — solo mueven dinero de un lugar a otro.

### Compra de USD

1. Selecciona la opcion de **Compra USD**.
2. Ingresa el monto en ARS que queres convertir.
3. La app usa la cotizacion vigente para calcular los USD recibidos.
4. Tu **Liquido ARS** disminuye y tu **Liquido USD** aumenta.

### USD de efectivo no trackeado

Si recibis dolares de una fuente que no estaba registrada en la app:

1. Selecciona la opcion correspondiente.
2. Ingresa el monto en USD y el **origen** explicito del dinero.
3. Los USD se suman a tu Liquido USD.

### Ajustar saldo real

Si tu saldo real no coincide con lo que muestra la app (por ejemplo, por gastos no registrados):

1. Selecciona **Ajustar saldo real**.
2. Ingresa el saldo verdadero que tenes.
3. La app crea automaticamente un movimiento de ajuste para igualar el saldo declarado.

---

## Gastos Recurrentes

Automatiza gastos que se repiten todos los meses.

### Crear un gasto recurrente

1. Presiona **Agregar recurrente**.
2. Completa los campos:
   - **Nombre** — Descripcion del gasto (ej: "Netflix", "Gimnasio").
   - **Monto** — Cuanto cuesta por mes.
   - **Categoria** — Categoria del gasto.
   - **Frecuencia** — Mensual.
3. Confirma para activar.

El gasto se genera automaticamente cada mes.

### Gestionar recurrentes

- **Pausar** — Suspende temporalmente el gasto sin eliminarlo.
- **Cancelar** — Elimina el gasto recurrente definitivamente.
- **Marcar como pagado** — Cada mes, confirma que el gasto fue efectivamente pagado.

---

## Presupuestos

Establece limites de gasto por categoria para controlar tus finanzas.

### Crear un presupuesto

1. Presiona **Agregar presupuesto**.
2. Selecciona la **categoria** de gastos.
3. Ingresa el **limite mensual** (monto maximo que queres gastar).
4. Confirma para activar.

### Seguimiento

- Cada presupuesto muestra una **barra de progreso** visual con el porcentaje gastado vs el limite.
- Cuando te acercas al limite, aparece una **alerta** visual.
- Si superas el limite, la barra indica que excediste el presupuesto.

---

## Prestamos

Registra dinero que prestaste o que te prestaron.

### Registrar un prestamo dado

1. Selecciona **"Le preste a..."**.
2. Ingresa el **nombre** de la persona y el **monto**.
3. Confirma para registrar.

El prestamo dado se cuenta como un activo en tu **Patrimonio Total** (te deben dinero).

### Registrar una deuda

1. Selecciona **"Debo a..."**.
2. Ingresa el **nombre** de la persona y el **monto**.
3. Confirma para registrar.

La deuda se cuenta como un pasivo que reduce tu **Patrimonio Total**.

### Cobrar o pagar

- **Marcar como cobrado** — El dinero prestado vuelve a tu **Liquido**. El prestamo se cierra.
- **Marcar como pagada** — Pagas la deuda. El monto sale de tu **Liquido**. La deuda se cierra.

---

## Configuracion

Accede a todos los ajustes de la app desde la tarjeta de Configuracion en la pantalla principal.

### Tipo de empleo

- **Dependiente** — Habilita el calculo automatico de **aguinaldo** en junio y diciembre.
- **Independiente** — No se calcula aguinaldo.

### Dia de cobro

Configura el dia del mes en que cobras tu ingreso fijo. Esto afecta:

- El modo de vista **Periodo** (calcula desde tu dia de cobro hasta el siguiente).
- El indicador de **"Pendiente de cobro"** cuando aun no llego el dia.

### Cotizacion USD

Establece la cotizacion global del dolar. Se usa para:

- Convertir tu **Liquido USD** a pesos en el calculo de **Patrimonio Total**.
- Referencia para operaciones de compra de USD.

Podes actualizar la cotizacion en cualquier momento.

### Historial de sueldo

Mantene un registro historico de tus ingresos fijos:

1. Presiona **Agregar** para registrar un nuevo monto de ingreso fijo.
2. El nuevo valor se aplica desde el mes actual en adelante.
3. Podes **editar** o **eliminar** entradas anteriores.

> **Nota:** El historial permite ver como evoluciono tu ingreso fijo a lo largo del tiempo. Los cambios se aplican hacia adelante, no retroactivamente a meses ya cerrados.

### Exportar datos

1. Presiona **Exportar datos**.
2. Se descarga un archivo JSON con todos tus datos.
3. Guarda este archivo como backup o para transferir a otro dispositivo.

### Importar datos

1. Presiona **Importar datos**.
2. Selecciona un archivo JSON exportado previamente.
3. La app valida el archivo. Si es corrupto o incompatible, lo rechaza con un mensaje de error.
4. Si es valido, se cargan todos los datos y la app se recarga completamente.

> **Nota:** Importar datos reemplaza TODOS los datos actuales. Asegurate de exportar un backup antes si tenes datos que quieras conservar.

### Re-ejecutar wizard

1. Presiona **Re-ejecutar wizard** en Configuracion.
2. Aparece un dialogo de confirmacion advirtiendo que **se borran TODOS los datos**.
3. Si confirmas, se limpia localStorage completamente y se lanza el wizard como si fuera la primera vez.

> **Nota:** Esta accion es irreversible. Exporta tus datos antes si queres conservarlos.

---

## Moneda Dual (ARS/USD)

La app maneja pesos argentinos y dolares de forma separada para reflejar tu realidad financiera con precision.

### Saldos separados

- **Liquido ARS** y **Liquido USD** son saldos reales e independientes.
- Las operaciones en pesos afectan Liquido ARS; las operaciones en dolares afectan Liquido USD.

### Cotizacion por transaccion

Cada transaccion que involucra dolares almacena la **cotizacion USD** vigente en el momento de registro. Esto permite:

- Calcular la **ganancia o perdida cambiaria** comparando la cotizacion de compra con la cotizacion actual.
- Rastrear el costo real en pesos de cada operacion en dolares.

### Cotizacion global

La **cotizacion USD** configurada en Configuracion se usa para calcular el **Patrimonio Total** (convirtiendo Liquido USD a ARS para sumar todo).

### Flujo de compra de USD

1. Indica cuantos ARS queres convertir.
2. La app usa la cotizacion vigente para calcular los USD.
3. Tu Liquido ARS baja y tu Liquido USD sube.
4. La transaccion queda registrada con la cotizacion usada.

### Edicion retroactiva de cotizacion

Podes editar la cotizacion de transacciones pasadas si fue cargada con un valor incorrecto. El patrimonio se recalcula con el nuevo valor.

---

## Glosario de Terminos

| Termino | Definicion |
|---------|-----------|
| **Ingreso fijo** | Tu ingreso mensual regular (configurado en Configuracion). |
| **Otros ingresos** | Ingresos adicionales al ingreso fijo, cargados manualmente cada mes. |
| **Aguinaldo** | Bonus semestral automatico para tipo Dependiente (50% del mejor ingreso fijo del semestre, en junio y diciembre). |
| **Patrimonio Total** | Suma de Liquido ARS + Liquido USD (convertido) + Inversiones activas. |
| **Liquido ARS** | Dinero disponible en pesos argentinos (efectivo y cuentas). |
| **Liquido USD** | Dinero disponible en dolares estadounidenses. |
| **Disponible** | Dinero restante del mes despues de gastos y aportes a inversiones. |
| **Pendiente de cobro** | Indicador que aparece cuando aun no llego tu dia de cobro en el mes. |
| **Gastos** | Egresos de dinero registrados por categoria y fecha. |
| **Cuotas** | Pagos en cuotas: un gasto dividido en pagos mensuales. |
| **Aportes** | Dinero que destinas a una inversion (reduce tu Liquido). |
| **Retiros** | Dinero que sacas de una inversion (aumenta tu Liquido). |
| **Valor actual** | Valor de mercado actual de una inversion. |
| **Ganancia/perdida** | Diferencia entre el valor actual y el total aportado a una inversion. |
| **Rendimiento %** | Porcentaje de ganancia o perdida de una inversion. |
| **Cotizacion USD** | Tipo de cambio peso/dolar usado para conversiones y patrimonio. |
| **Dependiente** | Tipo de empleo en relacion de dependencia (habilita aguinaldo). |
| **Independiente** | Tipo de empleo autonomo/freelance (sin aguinaldo). |
| **Dia de cobro** | Dia del mes en que cobras tu ingreso fijo. |
| **Periodo** | Modo de vista que cuenta desde un dia de cobro hasta el siguiente. |
| **Mes** | Modo de vista por mes calendario (del 1 al 30/31). |
| **Recurrentes** | Gastos que se repiten automaticamente cada mes. |
| **Presupuestos** | Limites de gasto mensuales por categoria. |
| **Prestamos** | Dinero prestado a otros (activo) o adeudado a otros (pasivo). |
| **Transferencia** | Movimiento de dinero entre cuentas propias (no cambia el patrimonio). |
| **Ajustar saldo real** | Correccion automatica del saldo para que coincida con la realidad. |
| **Re-ejecutar wizard** | Borra todos los datos y lanza el asistente de configuracion inicial. |
