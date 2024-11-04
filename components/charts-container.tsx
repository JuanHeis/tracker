import { MonthlyData } from "@/hooks/useExpenseTracker";
import { ExpensesByMonth } from "./charts/expenses-by-month";
import { SalaryByMonth } from "./charts/salary-by-month";

interface ChartsContainerProps {
  monthlyData: MonthlyData;
  selectedYear: string;
}

export default function ChartsContainer({ monthlyData, selectedYear }: ChartsContainerProps) {
  return (
    <div className="space-y-8">
      <ExpensesByMonth monthlyData={monthlyData} selectedYear={selectedYear} />
      <SalaryByMonth monthlyData={monthlyData} selectedYear={selectedYear} />
    </div>
  );
}
