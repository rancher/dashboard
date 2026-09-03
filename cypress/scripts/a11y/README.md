# Accessibility ratchet

A **ratchet** gate for the Cypress accessibility (a11y) suite: existing violations are
accepted via a committed baseline, but any **new** violation fails CI. Paired with two
weekly agentic workflows, it forms a closed loop that drives a11y debt down over time
without a big-bang cleanup.

## The loop

| Piece | What it does | Effect on the baseline |
|---|---|---|
| **A — Ratchet gate** (`compare-a11y.mjs`, wired into the `a11y-test` CI job) | Fails CI on any violation not in the baseline | ceiling — nothing may exceed it |
| **B — A11y Debt** (weekly agentic workflow, added separately) | Fixes accepted violations at the source | shrinks it |
| **C — A11y Coverage** (weekly agentic workflow, added separately) | Adds specs for new pages and accepts their violations | grows it |

Only **A** is in this change; B and C land as follow-ups. The gate is useful on its
own — it stops new regressions immediately, and the baseline can also be curated by
hand in the meantime.

C discovers debt, B remediates it, A guarantees the trend is one-way. The baseline's
size is a single burn-down metric.

## Files

- `fingerprint.mjs` — flattens the a11y report tree into **coarse** fingerprints:
  `sha256(testPath + " " + axeRuleId)`. Deliberately excludes the brittle axe `target`
  selector, so the gate is stable across runs. All instances of one rule on one page
  collapse to a single fingerprint (a regression ceiling, not per-node bookkeeping).
  The test path is normalised first (`normalizePath`) to drop the `${parent} (#n)`
  leaf the a11y plugin appends: `n` is a per-violating-node screenshot counter that
  renumbers when a sibling check changes, and the segment is present at all only
  while the plugin's `tidy()` collapse declines to fold it away. Including either
  would let accepted violations move under the ratchet for non-a11y reasons.
- `compare-a11y.mjs` — the CLI gate (see below).
- `fingerprint.test.mjs`, `compare-a11y.test.mjs` — unit tests, run with the built-in
  Node test runner (`node:test`) because Jest ignores `cypress/`. The CLI is tested as
  a subprocess, since its exit code is its contract with CI.
- `../../e2e/tests/accessibility/baseline.json` — the committed ledger of accepted
  violations. It lives next to the spec because `cypress/accessibility/` is gitignored.

## Commands

```sh
yarn a11y:compare    # gate: compare report vs baseline (see A11Y_RATCHET_ENFORCE below)
yarn a11y:baseline   # regenerate the baseline from the current report
yarn a11y:test       # run the ratchet unit tests
```

`compare-a11y.mjs` reads:

- the report from `A11Y_REPORT_PATH` (default `cypress/accessibility/accessibility.json`),
  produced by the a11y plugin when the suite runs with `TEST_A11Y=true`;
- the baseline from `A11Y_BASELINE_PATH` (default `cypress/e2e/tests/accessibility/baseline.json`).

Exit codes: `0` clean / soft mode / `--update` ok · `1` new violations (hard mode) ·
`2` the report cannot support a trustworthy comparison.

Enforcement is **opt-in**: the gate reports without failing unless
`A11Y_RATCHET_ENFORCE` is exactly `true`. Every other value — unset, empty, `false`,
`0` — is report-only, so a missing or mistyped repo variable can never turn the gate
on by accident. `--soft` forces report-only regardless. Soft mode also downgrades the
exit-2 cases below to a warning, so during the rollout the gate cannot redden a job
for any reason. `--update` ignores soft mode: writing a hollow baseline would
silently lower the ratchet, so a bad report is always fatal there.

## Completeness

A crashed or truncated run still writes a report — Cypress fires `after:run` either
way — and that report is a strict *subset* of the baseline. Nothing looks new, so a
naive comparison prints a green ratchet directly beneath a broken run. Three things
prevent that false green:

- the report must contain at least one test (`stats.totalTests > 0`);
- it must cover at least as many tests as the baseline was taken from. `--update`
  records the run's `stats` in `baseline.json` for exactly this comparison. The check
  is inert on baselines predating the field, and re-baselining keeps it current. If
  coverage was reduced deliberately, re-baseline and commit;
- the CI step runs `if: success()`, so it does not even attempt a comparison when the
  test step failed. Violations are collected with `skipFailures`, so they never redden
  that step — a red one means the run itself broke. The report is still uploaded on
  failure, so nothing is lost.

## Rollout (soft launch → hard fail)

The CI step reads the `A11Y_RATCHET_ENFORCE` repo variable:

1. **Soft launch:** leave `A11Y_RATCHET_ENFORCE` unset (or set it to anything other
   than `true`). New violations are reported in the job log but do **not** fail the
   build.
2. **Watch a few runs.** The baseline shipped here was seeded from a real green
   `a11y-test` run rather than a local render, which avoids day-one false positives,
   but a soft window confirms it is stable across runs before it starts blocking.
   If it needs refreshing, re-seed from CI (see below) — never from a local render.
3. **Flip to enforcing:** set `A11Y_RATCHET_ENFORCE` to `true`. From then on, new
   violations hard-fail the `a11y-test` job. This is a variable flip — no code change.

To **re-seed from CI**: download the `accessibility-report` artifact from a green
`a11y-test` run into `cypress/accessibility/`, run `yarn a11y:baseline`, review the
diff, and commit the updated `baseline.json`.

## Baseline hygiene

- To **accept** a violation (coverage): run the suite, then `yarn a11y:baseline`, and
  commit. Prefer doing this from a CI artifact.
- To **remove** a violation (debt): fix it in `shell/`/`pkg/`, then delete its entry from
  `baseline.json` by hand. The next `a11y:compare` re-detects it if the fix is incomplete
  (it is no longer accepted), so the fix is self-verifying. Do **not** run `a11y:baseline`
  to remove entries — that would re-accept everything currently present.
