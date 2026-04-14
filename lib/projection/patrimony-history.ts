import type { MonthlyData } from "@/hooks/useMoneyTracker";
import type { SalaryEntry } from "@/hooks/useSalaryHistory";
import { getSalaryForMonth } from "@/hooks/useSalaryHistory";
import { CurrencyType } from "@/constants/investments";
import type { HistoricalPoint } from "./types";

/**
 * Extract yyyy-MM from a yyyy-MM-dd date string.
 */
function toMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/**
 * Collect all unique month keys from the dataset, sorted chronologically.
 */
function collectMonthKeys(
  monthlyData: MonthlyData,
  salaryHistory: SalaryEntry[]
): string[] {
  const keys = new Set<string>();

  // From expenses
  for (const e of monthlyData.expenses) {
    keys.add(toMonthKey(e.date));
  }

  // From extra incomes
  for (const ei of monthlyData.extraIncomes) {
    keys.add(toMonthKey(ei.date));
  }

  // From investment movements
  for (const inv of monthlyData.investments) {
    for (const m of inv.movements) {
      keys.add(toMonthKey(m.date));
    }
  }

  // From transfers
  if (monthlyData.transfers) {
    for (const t of monthlyData.transfers) {
      keys.add(toMonthKey(t.date));
    }
  }

  // From loans
  if (monthlyData.loans) {
    for (const l of monthlyData.loans) {
      keys.add(toMonthKey(l.date));
      for (const p of l.payments) {
        keys.add(toMonthKey(p.date));
      }
    }
  }

  // From salary history
  for (const s of salaryHistory) {
    keys.add(s.effectiveDate);
  }

  // From USD purchases
  for (const u of monthlyData.usdPurchases) {
    keys.add(toMonthKey(u.date));
  }

  return Array.from(keys).sort();
}

/**
 * Reconstruct historical patrimony from monthlyData.
 *
 * Uses a simplified cumulative approach:
 * - Running liquid balance = cumulative (salary + incomes - expenses +/- transfers +/- loans)
 * - Investment values = movement-based proxy for past months, currentValue for latest
 * - All USD converted to ARS at globalUsdRate (known limitation)
 */
export function reconstructHistoricalPatrimony(
  monthlyData: MonthlyData,
  salaryHistory: SalaryEntry[],
  globalUsdRate: number
): HistoricalPoint[] {
  const monthKeys = collectMonthKeys(monthlyData, salaryHistory);
  if (monthKeys.length === 0) return [];

  const lastMonthKey = monthKeys[monthKeys.length - 1];
  let runningLiquidARS = 0;
  let runningLiquidUSD = 0;
  const results: HistoricalPoint[] = [];

  for (const monthKey of monthKeys) {
    const overrides = monthlyData.salaryOverrides || {};

    // Salary for this month
    const salaryRes = getSalaryForMonth(monthKey, salaryHistory, overrides);
    runningLiquidARS += salaryRes.amount;

    // Extra incomes this month
    for (const ei of monthlyData.extraIncomes) {
      if (toMonthKey(ei.date) === monthKey) {
        if (ei.currencyType === CurrencyType.USD) {
          runningLiquidUSD += ei.amount;
        } else {
          runningLiquidARS += ei.amount;
        }
      }
    }

    // Expenses this month
    for (const e of monthlyData.expenses) {
      if (toMonthKey(e.date) === monthKey) {
        if (e.currencyType === CurrencyType.USD) {
          runningLiquidUSD -= e.amount;
        } else {
          runningLiquidARS -= e.amount;
        }
      }
    }

    // USD purchases this month
    for (const u of monthlyData.usdPurchases) {
      if (toMonthKey(u.date) === monthKey) {
        runningLiquidARS -= u.arsAmount;
        runningLiquidUSD += u.usdAmount;
      }
    }

    // Transfers this month
    if (monthlyData.transfers) {
      for (const t of monthlyData.transfers) {
        if (toMonthKey(t.date) === monthKey) {
          switch (t.type) {
            case "currency_ars_to_usd":
              runningLiquidARS -= t.arsAmount ?? 0;
              runningLiquidUSD += t.usdAmount ?? 0;
              break;
            case "currency_usd_to_ars":
              runningLiquidUSD -= t.usdAmount ?? 0;
              runningLiquidARS += t.arsAmount ?? 0;
              break;
            case "cash_out":
              if (t.currency === "USD") {
                runningLiquidUSD -= t.amount ?? 0;
              } else {
                runningLiquidARS -= t.amount ?? 0;
              }
              break;
            case "cash_in":
              if (t.currency === "USD") {
                runningLiquidUSD += t.amount ?? 0;
              } else {
                runningLiquidARS += t.amount ?? 0;
              }
              break;
            case "adjustment_ars":
              runningLiquidARS += t.amount ?? 0;
              break;
            case "adjustment_usd":
              runningLiquidUSD += t.amount ?? 0;
              break;
          }
        }
      }
    }

    // Loans this month
    if (monthlyData.loans) {
      for (const l of monthlyData.loans) {
        // Loan creation: preste = I lent out (reduces liquid), debo = I borrowed (increases liquid)
        if (toMonthKey(l.date) === monthKey) {
          const amt =
            l.currencyType === CurrencyType.USD
              ? l.amount * globalUsdRate
              : l.amount;
          if (l.type === "preste") {
            runningLiquidARS -= amt;
          } else {
            runningLiquidARS += amt;
          }
        }
        // Payments on this loan in this month
        for (const p of l.payments) {
          if (toMonthKey(p.date) === monthKey) {
            const pAmt =
              l.currencyType === CurrencyType.USD
                ? p.amount * globalUsdRate
                : p.amount;
            if (l.type === "preste") {
              // Getting repaid: increases liquid
              runningLiquidARS += pAmt;
            } else {
              // Paying back: decreases liquid
              runningLiquidARS -= pAmt;
            }
          }
        }
      }
    }

    // Investment values
    let investmentTotal = 0;
    for (const inv of monthlyData.investments) {
      if (monthKey === lastMonthKey) {
        // For the latest month, use currentValue
        const val =
          inv.currencyType === CurrencyType.USD
            ? inv.currentValue * globalUsdRate
            : inv.currentValue;
        investmentTotal += val;
      } else {
        // For past months, use cumulative movements as proxy
        let movementSum = 0;
        for (const m of inv.movements) {
          if (m.pendingIngreso) continue;
          if (toMonthKey(m.date) <= monthKey) {
            movementSum +=
              m.type === "aporte" ? m.amount : -m.amount;
          }
        }
        const val =
          inv.currencyType === CurrencyType.USD
            ? movementSum * globalUsdRate
            : movementSum;
        investmentTotal += Math.max(0, val);
      }
    }

    // Loan assets/liabilities
    let loanAssets = 0;
    let loanLiabilities = 0;
    if (monthlyData.loans) {
      for (const l of monthlyData.loans) {
        if (toMonthKey(l.date) <= monthKey) {
          const totalPaid = l.payments
            .filter((p) => toMonthKey(p.date) <= monthKey)
            .reduce((s, p) => s + p.amount, 0);
          const remaining = Math.max(0, l.amount - totalPaid);
          const val =
            l.currencyType === CurrencyType.USD
              ? remaining * globalUsdRate
              : remaining;
          if (l.type === "preste") {
            loanAssets += val;
          } else {
            loanLiabilities += val;
          }
        }
      }
    }

    const patrimony =
      runningLiquidARS +
      runningLiquidUSD * globalUsdRate +
      investmentTotal +
      loanAssets -
      loanLiabilities;

    results.push({
      monthKey,
      patrimony: Math.round(patrimony),
    });
  }

  return results;
}
