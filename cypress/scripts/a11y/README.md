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
- `compare-a11y.mjs` — the CLI gate (see below).
- `fingerprint.test.mjs` — unit tests, run with the built-in Node test runner
  (`node:test`) because Jest ignores `cypress/`.
- `../../e2e/tests/accessibility/baseline.json` — the committed ledger of accepted
  violations. It lives next to the spec because `cypress/accessibility/` is gitignored.

## Commands

```sh
yarn a11y:compare    # gate: compare report vs baseline (exit 1 on new violations)
yarn a11y:baseline   # regenerate the baseline from the current report
yarn a11y:test       # run the fingerprint unit tests
```

`compare-a11y.mjs` reads:

- the report from `A11Y_REPORT_PATH` (default `cypress/accessibility/accessibility.json`),
  produced by the a11y plugin when the suite runs with `TEST_A11Y=true`;
- the baseline from `A11Y_BASELINE_PATH` (default `cypress/e2e/tests/accessibility/baseline.json`).

Exit codes: `0` clean / soft mode / `--update` ok · `1` new violations (hard mode) ·
`2` report missing, empty (`stats.totalTests === 0`), or malformed — it refuses to
compare a hollow run rather than give a false green.

## Rollout (soft launch → hard fail)

The CI step reads the `A11Y_RATCHET_ENFORCE` repo variable:

1. **Soft launch:** leave `A11Y_RATCHET_ENFORCE` unset or `false`. New violations are
   reported in the job log but do **not** fail the build.
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
