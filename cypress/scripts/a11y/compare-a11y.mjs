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
//   1  new violations found (enforcing mode)
//   2  report missing/empty/malformed — refuse to compare a hollow run
//
// Soft rollout: enforcement is OPT-IN. New violations are reported without
// failing the build until A11Y_RATCHET_ENFORCE is explicitly 'true' (or
// --enforce is passed), so the baseline can stabilise first. This default
// matters in CI: an undefined `vars.*` is injected as an empty string, which
// must not be mistaken for "enforce".

/* eslint-disable no-console -- this is a CLI; console is its output channel. */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { flatten } from './fingerprint.mjs';

const REPORT_PATH = process.env.A11Y_REPORT_PATH || 'cypress/accessibility/accessibility.json';
const BASELINE_PATH = process.env.A11Y_BASELINE_PATH || 'cypress/e2e/tests/accessibility/baseline.json';

const argv = process.argv.slice(2);
const isUpdate = argv.includes('--update');

// Tolerate the casing/padding a hand-entered repo variable tends to pick up.
const enforceEnv = String(process.env.A11Y_RATCHET_ENFORCE ?? '').trim().toLowerCase();
const isSoft = argv.includes('--soft') || !(argv.includes('--enforce') || enforceEnv === 'true');

const IMPACT_ICON = {
  critical: '🔴', serious: '🟠', moderate: '🟡', minor: '⚪', unknown: '❔',
};

const line = (v) => `   - ${ IMPACT_ICON[v.impact] ?? IMPACT_ICON.unknown } [${ v.impact }] ${ v.rule } @ ${ v.where }`;

function readJson(path, label) {
  if (!existsSync(path)) {
    console.error(`❌ ${ label } not found at ${ path }`);
    process.exit(2);
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.error(`❌ ${ label } at ${ path } is not valid JSON: ${ e.message }`);
    process.exit(2);
  }
}

const report = readJson(REPORT_PATH, 'a11y report');

// Completeness guard: a crashed/partial run can produce a report with no tests.
// Comparing it would silently pass (missing pages look "fixed", new pages vanish),
// so refuse rather than give a false green.
const totalTests = report?.stats?.totalTests ?? 0;

if (totalTests === 0) {
  console.error('❌ a11y report contains 0 tests — the run likely crashed. Refusing to compare.');
  process.exit(2);
}

const current = flatten(report);

if (isUpdate) {
  const violations = [...current.values()].sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));
  const payload = {
    version:     1,
    description: 'Accepted a11y violations (ratchet baseline). CI fails on any violation not listed here. ' +
      'Regenerate with `yarn a11y:baseline` after running the a11y suite.',
    violations,
  };

  const dir = dirname(BASELINE_PATH);

  if (!existsSync(dir)) {
    console.error(`❌ baseline directory ${ dir } does not exist`);
    process.exit(2);
  }

  writeFileSync(BASELINE_PATH, `${ JSON.stringify(payload, null, 2) }\n`);
  console.log(`✅ Wrote baseline with ${ violations.length } accepted violation(s) to ${ BASELINE_PATH }`);
  process.exit(0);
}

const baselineDoc = readJson(BASELINE_PATH, 'a11y baseline');
const baseline = new Map((baselineDoc?.violations ?? []).map((v) => [v.fingerprint, v]));

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

if (added.length) {
  const header = `\n❌ ${ added.length } NEW accessibility violation(s) not in the baseline:`;

  (isSoft ? console.log : console.error)(header);
  added.forEach((v) => (isSoft ? console.log : console.error)(line(v)));

  if (isSoft) {
    console.log('\n⚠️  Soft mode: reporting only, not failing the build. Set A11Y_RATCHET_ENFORCE=true to enforce.');
    process.exit(0);
  }

  console.error('\nFix the violation, or if it is intentionally accepted, run `yarn a11y:baseline` and commit the updated baseline.');
  process.exit(1);
}

console.log('\n✅ No new accessibility violations.');
process.exit(0);
