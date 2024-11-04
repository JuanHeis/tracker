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
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface SalaryByMonthProps {
  monthlyData: MonthlyData;
  selectedYear: string;
}

export function SalaryByMonth({ monthlyData, selectedYear }: SalaryByMonthProps) {
  const [activeTab, setActiveTab] = useState("ars");

  const getMonthlySalaries = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(Number(selectedYear), i, 1);
      return format(date, "yyyy-MM");
    });

    return months.map((month) => {
      const salary = monthlyData.salaries[month];
      return {
        month: format(parse(month, "yyyy-MM", new Date()), "MMM", {
          locale: es,
        }),
        ars: salary?.amount || 0,
        usd: salary ? salary.amount / salary.usdRate : 0,
      };
    });
  };

  const data = getMonthlySalaries();

  return (
    <Card className="m-0 border-none shadow-none p-0">
      <CardHeader className="px-0">
        <div className="flex items-center justify-between">
          <CardTitle>Salario por Mes - {selectedYear}</CardTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="ars">ARS</TabsTrigger>
              <TabsTrigger value="usd">USD</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
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
              tickFormatter={(value) =>
                `${activeTab === "ars" ? "$" : "USD "}${value.toLocaleString()}`
              }
            />
            <Tooltip
              formatter={(value: number) => [
                `${activeTab === "ars" ? "$" : "USD "}${value.toLocaleString()}`,
                "Salario",
              ]}
              cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
            />
            <Bar
              dataKey={activeTab}
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
