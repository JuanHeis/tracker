# Expense Tracker App

Una aplicación web para el seguimiento de gastos personales, desarrollada con Next.js 14, Tailwind CSS y shadcn/ui.

## Características Principales

- 📊 Seguimiento de gastos mensuales
- 💰 Control de ingresos y salarios
- 📈 Gestión de inversiones
- 📱 Diseño responsive
- 📊 Visualización de datos con gráficos
- 💵 Soporte para múltiples monedas (ARS/USD)

## Estructura del Proyecto

### 📁 /app
Contiene la configuración principal de Next.js y las páginas de la aplicación.

- `layout.tsx`: Layout principal de la aplicación
- `page.tsx`: Página principal
- `globals.css`: Estilos globales

### 📁 /components
Componentes reutilizables de la aplicación:

#### Componentes Principales
- `expense-tracker.tsx`: Componente principal que maneja la lógica de la interfaz
- `salary-card.tsx`: Tarjeta para mostrar y editar información del salario
- `expenses-table.tsx`: Tabla para mostrar y gestionar gastos
- `income-table.tsx`: Tabla para mostrar y gestionar ingresos adicionales
- `investments-table.tsx`: Tabla para mostrar y gestionar inversiones
- `investment-dialog.tsx`: Modal para agregar/editar inversiones

#### Componentes de UI
- `/ui/*`: Componentes de interfaz basados en shadcn/ui (button, card, dialog, etc.)

### 📁 /hooks
Hooks personalizados para la lógica de negocio:

- `useMoneyTracker.ts`: Hook principal para la gestión del estado y lógica de la aplicación
- `useExpensesTracker.ts`: Lógica para el manejo de gastos
- `useIncomes.ts`: Lógica para el manejo de ingresos
- `useInvestmentsTracker.ts`: Lógica para el manejo de inversiones
- `useHydration.ts`: Hook para manejar la hidratación del cliente
- `useLocalStorage.ts`: Hook para persistencia en localStorage

## Tecnologías Utilizadas

- [Next.js 14](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [date-fns](https://date-fns.org/)
- [Recharts](https://recharts.org/)

## Instalación

1. Clona el repositorio:

```bash
git clone
```

## Funcionamiento y Cálculos Principales

### Gestión de Salarios
```typescript
interface Salary {
  amount: number;    // Monto en ARS
  usdRate: number;   // Tasa de cambio USD
}

// Almacenado por mes
salaries: {
  "2024-01": { amount: 1000000, usdRate: 1000 },
  "2024-02": { amount: 1100000, usdRate: 1100 }
}
```

El salario se almacena mensualmente junto con la tasa de cambio USD del momento.

### Gestión de Gastos
```typescript
interface Expense {
  id: string;
  date: string;
  name: string;
  amount: number;
  usdRate: number;
  category: Category;
  currencyType: CurrencyType;
  installments?: {
    total: number;
    current: number;
    startDate: string;
  };
}
```

Los gastos pueden registrarse en ARS o USD y soportan:
- Pagos en cuotas
- Categorización
- Conversión automática según tasa de cambio

### Ingresos Extra
```typescript
interface ExtraIncome {
  id: string;
  date: string;
  name: string;
  amount: number;
  usdRate: number;
  currencyType: CurrencyType;
}
```

Permite registrar ingresos adicionales al salario.

### Inversiones
```typescript
interface Investment {
  id: string;
  date: string;
  name: string;
  amount: number;
  type: "Plazo Fijo" | "Acciones" | "Bonos" | "Otros";
  status: "Activa" | "Finalizada";
  expectedEndDate: string;
  usdRate: number;
  currencyType: CurrencyType;
}
```

### Cálculos Principales

#### Dinero Disponible
```typescript
const availableMoney = currentSalary - totalExpenses;
```

#### Total de Gastos Mensuales
```typescript
const totalExpenses = filteredExpenses.reduce(
  (sum, expense) => sum + expense.amount,
  0
);
```

#### Conversión de Monedas
```typescript
// USD a ARS
if (currencyType === CurrencyType.USD) {
  amount = amount * usdRate;
}
```

#### Total General
```typescript
const calculateTotalAvailable = () => {
  return {
    // Dinero disponible para usar
    availableForUse: totalSalaries + totalExtraIncomes - totalExpenses - totalInvestments,
    
    // Dinero en inversiones
    blockedInInvestments: totalInvestments,
    
    // Total general
    total: totalSalaries + totalExtraIncomes - totalExpenses
  };
};
```

### Hooks Principales

#### useMoneyTracker
Hook principal que maneja:
- Estado global de la aplicación
- Selección de mes/año
- Cálculos totales
- Integración de otros hooks

#### useExpensesTracker
Maneja:
- CRUD de gastos
- Filtrado por mes
- Cálculo de totales por categoría
- Soporte para pagos en cuotas

#### useIncomes
Gestiona:
- Salarios mensuales
- Ingresos extra
- Conversiones de moneda

#### useInvestmentsTracker
Controla:
- CRUD de inversiones
- Estado de inversiones
- Fechas de vencimiento

#### useLocalStorage
Maneja la persistencia de datos:
- Guardado automático
- Migración de datos
- Recuperación del estado

## Componentes Principales

### ExpenseTracker
Componente principal que integra:
- Tabs de navegación
- Selector de mes/año
- Tablas de datos
- Formularios de ingreso

### SalaryCard
Muestra:
- Salario mensual
- Gastos totales
- Dinero disponible
- Formulario de edición

### ExpensesTable
Tabla interactiva con:
- Listado de gastos
- Categorización visual
- Acciones CRUD
- Soporte para cuotas

### InvestmentsTable
Muestra:
- Inversiones activas
- Estado y fechas
- Montos y tipos
- Acciones de gestión
