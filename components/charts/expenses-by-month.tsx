import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MonthlyData } from "@/hooks/useMoneyTracker";
import { format, parse, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { Coins } from "lucide-react";

const chartConfig = {
  label: "Gastos",
  icon: Coins,
} as ChartConfig;

interface ExpensesByMonthProps {
  monthlyData: MonthlyData;
  selectedYear: string;
}

export function ExpensesByMonth({
  monthlyData,
  selectedYear,
}: ExpensesByMonthProps) {
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
        <ChartContainer config={chartConfig}>
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
            <Bar
              dataKey="total"
              fill="currentColor"
              radius={[4, 4, 0, 0]}
              className="fill-primary"
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(value, name) => (
                <div className="flex min-w-[130px] items-center text-xs text-muted-foreground">
                  {chartConfig[name as keyof typeof chartConfig]?.label || name}
                  <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                    <span className="font-normal text-muted-foreground">$</span>
                    {value.toLocaleString()}
                  </div>
                </div>
              )}
              cursor={false}
              defaultIndex={1}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
