#!/usr/bin/env node
// Accessibility ratchet CLI.
//
//   node cypress/scripts/a11y/compare-a11y.mjs            # compare (gate)
//   node cypress/scripts/a11y/compare-a11y.mjs --update   # (re)generate the baseline
//
// Compare mode reads the freshly generated report and the committed baseline and
// fails (exit 1) if the report contains any violation fingerprint that is NOT in
// the baseline — i.e. a *new* regression. Existing (baselined) violations are
// accepted. This is the "ratchet": the accepted set can only be lowered via an
// explicit `--update`, so the debt trend is one-way.
//
// Exit codes:
//   0  no new violations (or soft mode, or --update succeeded)
//   1  new violations found (hard mode)
//   2  report missing/empty/partial/malformed — refuse to compare a hollow run
//
// Soft rollout: the gate reports without failing unless A11Y_RATCHET_ENFORCE=true.
// `--soft` forces report-only regardless.

/* eslint-disable no-console -- this is a CLI; console is its output channel. */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { flatten, norm } from './fingerprint.mjs';

const REPORT_PATH = process.env.A11Y_REPORT_PATH || 'cypress/accessibility/accessibility.json';
const BASELINE_PATH = process.env.A11Y_BASELINE_PATH || 'cypress/e2e/tests/accessibility/baseline.json';

const argv = process.argv.slice(2);
const isUpdate = argv.includes('--update');

// Enforcement is opt-in, and only the exact string 'true' opts in. An unset repo
// variable interpolates to '' in `${{ vars.A11Y_RATCHET_ENFORCE }}`, so testing for
// 'false' would have made "unset" mean *enforcing* — the opposite of the documented
// soft launch, and the gate would hard-fail on its very first run. Comparing against
// 'true' instead makes every other value (unset, '', 'false', 'False', '0', 'no')
// fall back to report-only, which is the safe direction for a rollout flag.
const isSoft = argv.includes('--soft') || norm(process.env.A11Y_RATCHET_ENFORCE).toLowerCase() !== 'true';

const OK = 0;
const NEW_VIOLATIONS = 1;
const UNUSABLE = 2;

const IMPACT_ICON = {
  critical: '🔴', serious: '🟠', moderate: '🟡', minor: '⚪', unknown: '❔',
};

const line = (v) => `   - ${ IMPACT_ICON[v.impact] ?? IMPACT_ICON.unknown } [${ v.impact }] ${ v.rule } @ ${ v.where }`;

/** Raised when the report or baseline cannot support a trustworthy comparison. */
class Unusable extends Error {}

function readJson(path, label) {
  if (!existsSync(path)) {
    throw new Unusable(`${ label } not found at ${ path }`);
  }

  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Unusable(`${ label } at ${ path } is not valid JSON: ${ e.message }`);
  }
}

/**
 * Refuse to draw a conclusion, and decide whether that refusal fails the build.
 *
 * In `--update` an unusable report is always fatal: writing a hollow baseline
 * would silently lower the ratchet, which is the one thing it exists to prevent.
 * In compare mode the soft rollout wins — a gate that is not yet trusted to turn a
 * job red should not do so merely because an earlier step died before writing a
 * report, which would stack a second, misleading failure onto an unrelated one.
 *
 * @param {string} message Why the comparison cannot be trusted.
 * @returns {number} The process exit code to use.
 */
function bail(message) {
  if (!isUpdate && isSoft) {
    console.log(`⚠️  ${ message }`);
    console.log('⚠️  Soft mode: reporting only, not failing the build.');

    return OK;
  }

  console.error(`❌ ${ message }`);

  return UNUSABLE;
}

/**
 * Reject reports that cannot be compared. `stats` comes from Cypress's `after:run`.
 *
 * @param {object} report Parsed accessibility.json.
 * @returns {{ totalTests: number, totalPassed: number, totalFailed: number, totalSuites: number }} Run stats.
 */
function readStats(report) {
  const stats = report?.stats ?? {};
  const totalTests = stats.totalTests ?? 0;

  // A crashed run can still write a report; comparing it would silently pass,
  // because every missing page looks "fixed" and new pages simply never appear.
  if (totalTests === 0) {
    throw new Unusable('a11y report contains 0 tests — the run likely crashed. Refusing to compare.');
  }

  return {
    totalTests,
    totalPassed: stats.totalPassed ?? 0,
    totalFailed: stats.totalFailed ?? 0,
    totalSuites: stats.totalSuites ?? 0,
  };
}

function update(current, stats) {
  const violations = [...current.values()].sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));
  const payload = {
    version:     1,
    description: 'Accepted a11y violations (ratchet baseline). CI fails on any violation not listed here. ' +
      'Regenerate with `yarn a11y:baseline` after running the a11y suite.',
    // Recorded so a later compare can tell a full run from a truncated one; see
    // the coverage check in compare().
    stats,
    violations,
  };

  const dir = dirname(BASELINE_PATH);

  if (!existsSync(dir)) {
    throw new Unusable(`baseline directory ${ dir } does not exist`);
  }

  writeFileSync(BASELINE_PATH, `${ JSON.stringify(payload, null, 2) }\n`);
  console.log(`✅ Wrote baseline with ${ violations.length } accepted violation(s) from ${ stats.totalTests } test(s) to ${ BASELINE_PATH }`);

  return OK;
}

function compare(current, stats) {
  const baselineDoc = readJson(BASELINE_PATH, 'a11y baseline');
  const baseline = new Map((baselineDoc?.violations ?? []).map((v) => [v.fingerprint, v]));

  // Coverage guard. `totalTests > 0` only catches a total crash; the likelier shape
  // is a run that dies partway, since Cypress still fires `after:run`. Such a report
  // is a strict subset of the baseline, so nothing looks new and the gate reports a
  // false green directly beneath a red test step. Comparing against the test count
  // the baseline was taken from catches that. It stays inert on baselines predating
  // the field, and re-baselining keeps it current.
  const expected = baselineDoc?.stats?.totalTests ?? 0;

  if (expected && stats.totalTests < expected) {
    throw new Unusable(
      `a11y report covers ${ stats.totalTests } test(s) but the baseline was taken from ${ expected }. ` +
      'A partial run hides new violations and makes unreached pages look fixed, so the comparison is not ' +
      'trustworthy. Re-run the suite, or if coverage was reduced deliberately, run `yarn a11y:baseline` ' +
      'and commit the updated baseline.');
  }

  // Not fatal on its own — a failed assertion does not necessarily mean pages were
  // missed, and the coverage guard above catches the case where they were.
  if (stats.totalFailed) {
    console.log(`⚠️  ${ stats.totalFailed } test(s) failed in this run; some pages may not have been reached.`);
  }

  const added = [...current.values()].filter((v) => !baseline.has(v.fingerprint));
  const fixed = [...baseline.values()].filter((v) => !current.has(v.fingerprint));

  console.log(`ℹ️  a11y ratchet: ${ current.size } current, ${ baseline.size } baselined, ` +
    `${ added.length } new, ${ fixed.length } no longer present.`);

  // "fixed" is informational only — a coarse fingerprint or a partly-skipped run can
  // legitimately hide a still-present sibling, so we never fail on it.
  if (fixed.length) {
    console.log(`\n♻️  ${ fixed.length } baselined violation(s) no longer present — consider \`yarn a11y:baseline\` to prune:`);
    fixed.forEach((v) => console.log(line(v)));
  }

  if (!added.length) {
    console.log('\n✅ No new accessibility violations.');

    return OK;
  }

  const out = isSoft ? console.log : console.error;

  out(`\n❌ ${ added.length } NEW accessibility violation(s) not in the baseline:`);
  added.forEach((v) => out(line(v)));

  if (isSoft) {
    console.log('\n⚠️  Soft mode: reporting only, not failing the build. Set A11Y_RATCHET_ENFORCE=true to enforce.');

    return OK;
  }

  console.error('\nFix the violation, or if it is intentionally accepted, run `yarn a11y:baseline` and commit the updated baseline.');

  return NEW_VIOLATIONS;
}

function main() {
  try {
    const report = readJson(REPORT_PATH, 'a11y report');
    const stats = readStats(report);
    const current = flatten(report);

    return isUpdate ? update(current, stats) : compare(current, stats);
  } catch (e) {
    if (e instanceof Unusable) {
      return bail(e.message);
    }

    throw e;
  }
}

// `process.exitCode` rather than `process.exit()`: stdout/stderr are non-blocking
// when piped (as they are under GitHub Actions), so exiting immediately after
// writing can truncate the very list of violations a failing run exists to report.
process.exitCode = main();
