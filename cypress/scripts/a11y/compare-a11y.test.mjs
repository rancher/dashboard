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
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CLI = join(import.meta.dirname, 'compare-a11y.mjs');

let dir;
let reportPath;
let baselinePath;
let cleanReportPath;

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
});

after(() => rmSync(dir, { recursive: true, force: true }));

/**
 * Run the CLI against the fixtures.
 *
 * @param {{ enforce?: string, args?: string[], report?: string }} opts
 *   `enforce` is omitted from the environment entirely when undefined, which is
 *   distinct from passing an empty string.
 * @returns {{ status: number, stdout: string, stderr: string }}
 */
function run({ enforce, args = [], report } = {}) {
  const env = {
    ...process.env,
    A11Y_REPORT_PATH:   report ?? reportPath,
    A11Y_BASELINE_PATH: baselinePath,
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
