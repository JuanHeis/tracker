import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MonthlyData } from "@/hooks/useExpenseTracker";
import { format, parse, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

interface ExpensesByMonthProps {
  monthlyData: MonthlyData;
  selectedYear: string;
}

export function ExpensesByMonth({ monthlyData, selectedYear }: ExpensesByMonthProps) {
  const getMonthlyExpenses = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(Number(selectedYear), i, 1);
      return format(date, "yyyy-MM");
    });

    return months.map((month) => {
      const monthStart = startOfMonth(parse(month, "yyyy-MM", new Date()));
      const monthEnd = endOfMonth(monthStart);

      const totalExpenses = monthlyData.expenses
        .filter((expense) => {
          const expenseDate = parse(expense.date, "yyyy-MM-dd", new Date());
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        month: format(monthStart, "MMM", { locale: es }),
        total: totalExpenses,
      };
    });
  };

  const data = getMonthlyExpenses();

  return (
    <Card className="m-0 border-none shadow-none p-0">
      <CardHeader className="px-0">
        <CardTitle>Gastos por Mes - {selectedYear}</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: number) => [
                `$${value.toLocaleString()}`,
                "Total",
              ]}
              cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
            />
            <Bar
              dataKey="total"
              fill="currentColor"
              radius={[4, 4, 0, 0]}
              className="fill-primary"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
