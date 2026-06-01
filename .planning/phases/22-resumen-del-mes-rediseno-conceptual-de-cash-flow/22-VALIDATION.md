---
phase: 22
slug: resumen-del-mes-rediseno-conceptual-de-cash-flow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-01
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript type-check only (no jest/vitest configured) |
| **Config file** | tsconfig.json |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | Investment.purpose field | — | N/A | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 22-01-02 | 01 | 1 | resumenConfig localStorage | — | N/A | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 22-01-03 | 01 | 1 | month-metrics compute | — | N/A | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 22-01-04 | 01 | 1 | deficit-detector logic | — | N/A | type-check | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 22-02-01 | 02 | 2 | Investment wizard modal | — | N/A | build | `npm run build` | ❌ W0 | ⬜ pending |
| 22-02-02 | 02 | 2 | Inline purpose Select | — | N/A | build | `npm run build` | ✅ | ⬜ pending |
| 22-02-03 | 02 | 2 | ResumenCard redesign | — | N/A | build | `npm run build` | ✅ | ⬜ pending |
| 22-02-04 | 02 | 2 | Settings slider | — | N/A | build | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/resumen/month-metrics.ts` — stub for D1 Disponible + D2 Resultado del mes functions
- [ ] `lib/resumen/deficit-detector.ts` — stub for D5/D6 banner trigger logic
- [ ] `lib/resumen/resumen-config.ts` — stub for resumenConfig localStorage hook
- [ ] `components/investment-purpose-wizard/index.tsx` — stub for one-shot modal

*Existing infrastructure (tsconfig, tsc) covers all remaining requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Disponible formula visually correct | D1 | Requires real data in browser | Navigate to a month with sobrante > 0, verify Disponible = Sobrante + Ingresos − Egresos |
| Resultado del mes reflects investment purpose | D2/D3 | Requires live UI and investment data | Set an investment to "tarjeta", verify aporte does NOT reduce Resultado |
| Wizard shows once and not again | D10 | Browser state required | Clear localStorage, reload → wizard shows; complete → reload → no wizard |
| USD toggle switches correctly | D7 | Requires USD data | Have USD expenses, toggle to USD view, verify correct amounts shown |
| Deficit recurrente banner triggers | D6 | Requires multi-month data | Navigate to 3rd consecutive negative month → banner visible |
| Deficit anterior banner for negative sobrante | D5 | Requires negative sobrante month | Navigate to month where previous month ended negative → banner visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
