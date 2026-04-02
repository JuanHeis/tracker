"use client";

import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FormattedAmount } from "@/components/formatted-amount";
import { CATEGORIES } from "@/constants/colors";
import type { Category } from "@/hooks/useMoneyTracker";
import type { BudgetProgress } from "@/hooks/useBudgetTracker";

interface BudgetRowProps {
  progress: BudgetProgress;
  onEdit: (category: Category, currentLimit: number) => void;
  onDelete: (category: Category) => void;
}

export function BudgetRow({ progress, onEdit, onDelete }: BudgetRowProps) {
  const { category, limit, spent, percentage, expenses } = progress;
  const categoryColor = CATEGORIES[category]?.color ?? "#888";

  const barColor =
    percentage >= 100
      ? "rgb(239 68 68)"
      : percentage >= 80
        ? "rgb(245 158 11)"
        : categoryColor;

  const warningColor =
    percentage >= 100 ? "text-red-500" : "text-amber-500";

  return (
    <div className="space-y-1.5 py-2">
      {/* Row 1: Info line */}
      <div className="flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: categoryColor }}
        />
        <span className="font-medium text-sm">{category}</span>
        <div className="flex-1" />

        <span className="text-sm text-muted-foreground">
          <FormattedAmount value={spent} currency="$" /> /{" "}
          <FormattedAmount value={limit} currency="$" />
        </span>

        {percentage >= 100 ? (
          <span className="text-xs text-red-500 font-medium flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Excedido en <FormattedAmount value={spent - limit} currency="$" />
          </span>
        ) : percentage >= 80 ? (
          <span className={`text-xs font-medium flex items-center gap-1 ${warningColor}`}>
            <AlertTriangle className="h-3.5 w-3.5" />
            {Math.round(percentage)}%
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        )}

        <button
          onClick={() => onEdit(category, limit)}
          className="text-muted-foreground hover:text-blue-500 transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(category)}
          className="text-muted-foreground hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Row 2: Progress bar with tooltip */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="h-2 w-full rounded-full bg-muted cursor-pointer">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1 text-xs">
              {expenses.map((e) => (
                <div key={e.id} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{e.name}</span>
                  <span>${e.arsAmount.toLocaleString("es-AR")}</span>
                </div>
              ))}
              {expenses.length === 0 && (
                <span className="text-muted-foreground">
                  Sin gastos en este periodo
                </span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
