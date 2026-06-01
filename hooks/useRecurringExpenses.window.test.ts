import { describe, it, expect } from "vitest";
import {
  computeProjectionWindow,
  RECURRING_PROJECTION_MONTHS,
} from "./useRecurringExpenses";

const CURRENT = "2026-06";

describe("RECURRING_PROJECTION_MONTHS", () => {
  it("is 3 (forward horizon)", () => {
    expect(RECURRING_PROJECTION_MONTHS).toBe(3);
  });
});

describe("computeProjectionWindow", () => {
  it("clamps a past createdAt to the current month (core bug fix)", () => {
    // createdAt in the past must NEVER backfill into past months.
    expect(computeProjectionWindow("2026-01", CURRENT)).toEqual({
      startMonth: "2026-06",
      endMonth: "2026-09",
    });
  });

  it("starts at the current month when createdAt equals current", () => {
    expect(computeProjectionWindow("2026-06", CURRENT)).toEqual({
      startMonth: "2026-06",
      endMonth: "2026-09",
    });
  });

  it("honors a future createdAt one month ahead", () => {
    expect(computeProjectionWindow("2026-07", CURRENT)).toEqual({
      startMonth: "2026-07",
      endMonth: "2026-09",
    });
  });

  it("honors a future createdAt exactly at the horizon", () => {
    expect(computeProjectionWindow("2026-09", CURRENT)).toEqual({
      startMonth: "2026-09",
      endMonth: "2026-09",
    });
  });

  it("returns null when createdAt is beyond the horizon", () => {
    expect(computeProjectionWindow("2026-10", CURRENT)).toBeNull();
  });

  it("spans exactly 4 inclusive months for a past createdAt", () => {
    const window = computeProjectionWindow("2026-01", CURRENT);
    expect(window).not.toBeNull();
    // current, +1, +2, +3 = 4 months total
    const start = window!.startMonth;
    const end = window!.endMonth;
    // derive the inclusive month list without exporting iterateMonths
    const months: string[] = [];
    let [y, m] = start.split("-").map(Number);
    const [ey, em] = end.split("-").map(Number);
    while (y < ey || (y === ey && m <= em)) {
      months.push(`${y}-${String(m).padStart(2, "0")}`);
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    expect(months).toEqual(["2026-06", "2026-07", "2026-08", "2026-09"]);
    expect(months).toHaveLength(4);
  });
});
