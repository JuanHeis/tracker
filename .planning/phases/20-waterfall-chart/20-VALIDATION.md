---
phase: 20
slug: waterfall-chart
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-11
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.2 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run lib/projection/waterfall.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run lib/projection/waterfall.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-F1 | 20-01 | 1 | FLOW-01 | unit | `npx vitest run lib/projection/waterfall.test.ts -t "returns 5 bars"` | Wave 0 | pending |
| 01-F2 | 20-01 | 1 | FLOW-02 | unit | `npx vitest run lib/projection/waterfall.test.ts -t "recurringId"` | Wave 0 | pending |
| 01-F3 | 20-01 | 1 | FLOW-03 | unit | `npx vitest run lib/projection/waterfall.test.ts -t "subcategories"` | Wave 0 | pending |
| 01-F5 | 20-01 | 1 | FLOW-05 | unit | `npx vitest run lib/projection/waterfall.test.ts -t "USD"` | Wave 0 | pending |
| 02-T1 | 20-02 | 2 | FLOW-01 | manual | Visual: WaterfallChart renders 5 vertical bars | n/a | pending |
| 02-T2 | 20-02 | 2 | FLOW-04 | manual | Visual: adding expense updates waterfall reactively | n/a | pending |

---

## Wave 0 Gaps

- [ ] `lib/projection/waterfall.test.ts` — covers FLOW-01, FLOW-02, FLOW-03, FLOW-05
- Framework install: none needed (vitest 4.1.2 already installed and configured)

---

*Phase: 20-waterfall-chart*
*Validation strategy created: 2026-04-11*
