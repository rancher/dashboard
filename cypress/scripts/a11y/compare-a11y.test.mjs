// Unit tests for the a11y ratchet CLI's enforcement gating.
//
// The CLI signals through its exit code, so these drive it as a subprocess with
// synthetic report/baseline fixtures rather than importing it (it calls
// process.exit at module scope).
//
// See fingerprint.test.mjs for why this uses node:test rather than Jest.
//
//   node --test cypress/scripts/a11y/        (or: yarn a11y:test)

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CLI = join(import.meta.dirname, 'compare-a11y.mjs');

let dir;
let reportPath;
let baselinePath;
let cleanReportPath;
let hollowReportPath;
let malformedReportPath;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'a11y-ratchet-'));
  reportPath = join(dir, 'report.json');
  baselinePath = join(dir, 'baseline.json');
  cleanReportPath = join(dir, 'clean-report.json');

  // One violation that is deliberately absent from the baseline below.
  writeFileSync(reportPath, JSON.stringify({
    stats:    { totalTests: 1 },
    children: [{
      name:       'shell.spec.ts',
      children:   [],
      violations: [{
        id: 'brand-new-rule', impact: 'serious', help: 'h'
      }],
    }],
  }));

  writeFileSync(cleanReportPath, JSON.stringify({
    stats:    { totalTests: 1 },
    children: [{
      name: 'shell.spec.ts', children: [], violations: []
    }],
  }));

  writeFileSync(baselinePath, JSON.stringify({ version: 1, violations: [] }));

  // A crashed run still writes a report, just an empty one.
  hollowReportPath = join(dir, 'hollow-report.json');
  writeFileSync(hollowReportPath, JSON.stringify({ stats: { totalTests: 0 }, children: [] }));

  malformedReportPath = join(dir, 'malformed-report.json');
  writeFileSync(malformedReportPath, '{ not json');
});

after(() => rmSync(dir, { recursive: true, force: true }));

/**
 * Run the CLI against the fixtures.
 *
 * @param {{ enforce?: string, args?: string[], report?: string, baseline?: string }} opts
 *   `enforce` is omitted from the environment entirely when undefined, which is
 *   distinct from passing an empty string.
 * @returns {{ status: number, stdout: string, stderr: string }}
 */
function run({
  enforce, args = [], report, baseline
} = {}) {
  const env = {
    ...process.env,
    A11Y_REPORT_PATH:   report ?? reportPath,
    A11Y_BASELINE_PATH: baseline ?? baselinePath,
  };

  delete env.A11Y_RATCHET_ENFORCE;

  if (enforce !== undefined) {
    env.A11Y_RATCHET_ENFORCE = enforce;
  }

  const { status, stdout, stderr } = spawnSync(process.execPath, [CLI, ...args], { env, encoding: 'utf8' });

  return {
    status, stdout, stderr
  };
}

test('enforcement is opt-in: a new violation does not fail the build by default', () => {
  // GitHub Actions injects an undefined `vars.*` as an empty string, so the
  // unset and empty cases must behave identically — neither means "enforce".
  for (const enforce of [undefined, '', 'false']) {
    const { status, stdout } = run({ enforce });

    assert.equal(status, 0, `A11Y_RATCHET_ENFORCE=${ JSON.stringify(enforce) } should not fail the build`);
    assert.match(stdout, /NEW accessibility violation/, 'new violations should still be reported');
    assert.match(stdout, /Soft mode/);
  }
});

test('A11Y_RATCHET_ENFORCE=true fails the build on a new violation', () => {
  const { status, stderr } = run({ enforce: 'true' });

  assert.equal(status, 1);
  assert.match(stderr, /NEW accessibility violation/);
});

test('the enforce flag tolerates casing and surrounding whitespace', () => {
  for (const enforce of [' true ', 'TRUE', 'True']) {
    assert.equal(run({ enforce }).status, 1, `A11Y_RATCHET_ENFORCE=${ JSON.stringify(enforce) } should enforce`);
  }
});

test('a non-boolean enforce value is not mistaken for enforcement', () => {
  for (const enforce of ['1', 'yes', 'enforce']) {
    assert.equal(run({ enforce }).status, 0, `A11Y_RATCHET_ENFORCE=${ JSON.stringify(enforce) } should stay soft`);
  }
});

test('--enforce opts in without the environment variable', () => {
  assert.equal(run({ args: ['--enforce'] }).status, 1);
});

test('--soft wins over an enforcing environment', () => {
  const { status, stdout } = run({ enforce: 'true', args: ['--soft'] });

  assert.equal(status, 0);
  assert.match(stdout, /Soft mode/);
});

test('enforcing passes when there are no new violations', () => {
  const { status, stdout } = run({ enforce: 'true', report: cleanReportPath });

  assert.equal(status, 0);
  assert.match(stdout, /No new accessibility violations/);
});

// An unusable report is normally a symptom of an earlier CI step that has already
// failed, so soft mode should not pile on a second failure — but it must still say
// out loud that nothing was compared.
const UNUSABLE = () => [
  ['missing', join(dir, 'does-not-exist.json')],
  ['hollow (0 tests)', hollowReportPath],
  ['malformed', malformedReportPath],
];

test('soft mode warns but passes when the report is unusable', () => {
  for (const [label, report] of UNUSABLE()) {
    const { status, stdout } = run({ report });

    assert.equal(status, 0, `${ label } report should not fail the build in soft mode`);
    assert.match(stdout, /no comparison was made/i, `${ label } report should say nothing was compared`);
    assert.doesNotMatch(stdout, /No new accessibility violations/, `${ label } report must not report a clean pass`);
  }
});

test('enforcing mode still refuses to compare an unusable report', () => {
  for (const [label, report] of UNUSABLE()) {
    assert.equal(run({ enforce: 'true', report }).status, 2, `${ label } report should exit 2 when enforcing`);
  }
});

test('--update refuses an unusable report and leaves the baseline untouched', () => {
  // Soft mode is the default, so without this guard `yarn a11y:baseline` after a
  // crashed run would quietly overwrite the accepted set with an empty one.
  for (const [label, report] of UNUSABLE()) {
    const baseline = join(dir, 'update-target.json');
    const original = JSON.stringify({
      version:    1,
      violations: [{
        fingerprint: 'abc', where: 'w', rule: 'r'
      }]
    });

    writeFileSync(baseline, original);

    const { status } = run({
      report, baseline, args: ['--update']
    });

    assert.equal(status, 2, `--update with a ${ label } report should exit 2`);
    assert.equal(readFileSync(baseline, 'utf8'), original, `--update must not rewrite the baseline from a ${ label } report`);
  }
});
