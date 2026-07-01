---
phase: 23
slug: reconciliar-disponible-del-resumen-con-saldo-liquido-calcula
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-01
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.2 |
| **Config file** | `vitest.config.ts` (present) |
| **Quick run command** | `npx vitest run <target-file>` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <target-file>`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Central Invariant (this phase's reason to exist)

`Disponible(Resumen) == saldo líquido (calculateDualBalances)` para toda moneda + período.
The reconciliation test IS the validation. Anchor: junio 2026 ARS Disponible == $28.168,76.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| (to be filled by planner) | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add `"test": "vitest run"` script to `package.json`
- [ ] Fixture derived from `expense-tracker-backup-2026-06-30.json` (real backup) for the both-engines-agree test
- [ ] Testable entry point for the balance engine core (extract pure core of `calculateDualBalances` to `lib/` if required — Q1)

*Existing vitest infra covers execution; fixtures + extraction are the new dependencies.*

---

## Manual-Only Verifications

| Behavior | Why Manual | Test Instructions |
|----------|------------|-------------------|
| Visual: Resumen card muestra $28.168,76 en junio 2026 ARS, vista Período | UI render depende del estado real del usuario | Abrir app, junio 2026, ARS, vista Período; confirmar Disponible == saldo líquido mostrado |

*El grueso de la verificación es automatizado vía el test de reconciliación.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
