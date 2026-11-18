// Unit tests for the a11y ratchet CLI.
//
// The CLI is exercised as a subprocess rather than by importing it: it sets
// `process.exitCode` at module scope, and exit code *is* its contract with CI.
// Driving it through env vars and argv also covers the wiring the workflow relies
// on, which an in-process test of the individual functions would miss.
//
//   node --test cypress/scripts/a11y/        (or: yarn a11y:test)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, 'compare-a11y.mjs');
const workdir = mkdtempSync(join(tmpdir(), 'a11y-ratchet-'));

/** Build a report tree from `where` paths so fingerprints match the real ones. */
function report(stats, violations) {
  const root = {
    name: 'shell.spec.ts', violations: [], children: [],
  };

  for (const v of violations) {
    let cur = root;

    for (const segment of v.where.split(' > ').slice(1)) {
      let next = cur.children.find((c) => c.name === segment);

      if (!next) {
        next = {
          name: segment, violations: [], children: [],
        };
        cur.children.push(next);
      }
      cur = next;
    }
    cur.violations.push({ id: v.rule, impact: v.impact ?? 'minor', help: v.help ?? '' });
  }

  return { stats, children: [root] };
}

function write(name, contents) {
  const path = join(workdir, name);

  writeFileSync(path, JSON.stringify(contents));

  return path;
}

/**
 * Run the CLI.
 * @returns {{ code: number, out: string }} Exit code and combined output.
 */
function run({
  reportPath, baselinePath, enforce, args = [],
}) {
  const env = { ...process.env, A11Y_REPORT_PATH: reportPath, A11Y_BASELINE_PATH: baselinePath };

  if (enforce === undefined) {
    delete env.A11Y_RATCHET_ENFORCE;
  } else {
    env.A11Y_RATCHET_ENFORCE = enforce;
  }

  try {
    return { code: 0, out: execFileSync(process.execPath, [CLI, ...args], { env, encoding: 'utf8', stdio: 'pipe' }) };
  } catch (e) {
    return { code: e.status, out: `${ e.stdout ?? '' }${ e.stderr ?? '' }` };
  }
}

const accepted = { where: 'shell.spec.ts > Suite > Accepted page', rule: 'color-contrast', impact: 'serious' };
const regression = { where: 'shell.spec.ts > Suite > Other page', rule: 'listitem', impact: 'serious' };
const STATS = {
  totalTests: 10, totalPassed: 10, totalFailed: 0, totalSuites: 4,
};

// A baseline written by the CLI itself, so fingerprints are authoritative.
const seedReport = write('seed.json', report(STATS, [accepted]));
const baseline = join(workdir, 'baseline.json');

run({
  reportPath: seedReport, baselinePath: baseline, args: ['--update'],
});

test('--update records the run stats alongside the violations', () => {
  const doc = JSON.parse(readFileSync(baseline, 'utf8'));

  assert.deepEqual(doc.stats, STATS);
  assert.equal(doc.violations.length, 1);
});

// --- enforcement flag --------------------------------------------------------
//
// Only the literal 'true' may enforce: an unset repo variable reaches the script
// as '', and treating that as enforcing would hard-fail the documented soft launch.

const newViolation = write('new.json', report(STATS, [accepted, regression]));

for (const enforce of [undefined, '', 'false', 'False', '0']) {
  test(`new violations are report-only when A11Y_RATCHET_ENFORCE=${ enforce ?? '<unset>' }`, () => {
    const { code, out } = run({ reportPath: newViolation, baselinePath: baseline, enforce });

    assert.equal(code, 0);
    assert.match(out, /1 NEW accessibility violation/);
    assert.match(out, /Soft mode/);
  });
}

test('new violations fail the build when A11Y_RATCHET_ENFORCE=true', () => {
  const { code, out } = run({
    reportPath: newViolation, baselinePath: baseline, enforce: 'true',
  });

  assert.equal(code, 1);
  assert.match(out, /1 NEW accessibility violation/);
  assert.match(out, /listitem @ shell\.spec\.ts > Suite > Other page/, 'the offending violation must be listed');
});

test('--soft overrides an enforcing environment', () => {
  const { code } = run({
    reportPath: newViolation, baselinePath: baseline, enforce: 'true', args: ['--soft'],
  });

  assert.equal(code, 0);
});

test('a clean run passes under enforcement', () => {
  const clean = write('clean.json', report(STATS, [accepted]));
  const { code, out } = run({
    reportPath: clean, baselinePath: baseline, enforce: 'true',
  });

  assert.equal(code, 0);
  assert.match(out, /No new accessibility violations/);
});

// --- completeness ------------------------------------------------------------

test('a truncated run is refused rather than reported as clean', () => {
  // Strict subset of the baseline: nothing looks new, so without the coverage
  // guard this printed a green ratchet beneath a broken run.
  const truncated = write('truncated.json', report({ ...STATS, totalTests: 2 }, []));
  const { code, out } = run({
    reportPath: truncated, baselinePath: baseline, enforce: 'true',
  });

  assert.equal(code, 2);
  assert.match(out, /covers 2 test\(s\) but the baseline was taken from 10/);
});

test('a report with zero tests is refused', () => {
  const hollow = write('hollow.json', { stats: { totalTests: 0 }, children: [] });
  const { code, out } = run({
    reportPath: hollow, baselinePath: baseline, enforce: 'true',
  });

  assert.equal(code, 2);
  assert.match(out, /contains 0 tests/);
});

test('a baseline without stats leaves the coverage guard inert', () => {
  // Baselines predating the stats field must keep comparing rather than hard-fail.
  const legacy = join(workdir, 'legacy.json');
  const doc = JSON.parse(readFileSync(baseline, 'utf8'));

  delete doc.stats;
  writeFileSync(legacy, JSON.stringify(doc));

  const small = write('small.json', report({ ...STATS, totalTests: 2 }, [accepted]));
  const { code } = run({
    reportPath: small, baselinePath: legacy, enforce: 'true',
  });

  assert.equal(code, 0);
});

// --- soft mode covers infrastructure failures too -----------------------------

test('a missing report does not fail the build in soft mode', () => {
  // The gate must not stack a second, misleading failure onto a job that already
  // died before writing a report.
  const { code, out } = run({ reportPath: join(workdir, 'absent.json'), baselinePath: baseline });

  assert.equal(code, 0);
  assert.match(out, /not found/);
  assert.match(out, /Soft mode/);
});

test('a missing report fails the build under enforcement', () => {
  const { code } = run({
    reportPath: join(workdir, 'absent.json'), baselinePath: baseline, enforce: 'true',
  });

  assert.equal(code, 2);
});

test('malformed JSON is refused', () => {
  const bad = join(workdir, 'bad.json');

  writeFileSync(bad, '{ not json');

  const { code, out } = run({
    reportPath: bad, baselinePath: baseline, enforce: 'true',
  });

  assert.equal(code, 2);
  assert.match(out, /not valid JSON/);
});

test('--update refuses a hollow report even in soft mode', () => {
  // Writing a hollow baseline would silently lower the ratchet, so this stays fatal
  // regardless of the rollout flag.
  const hollow = write('hollow2.json', { stats: { totalTests: 0 }, children: [] });
  const { code } = run({
    reportPath: hollow, baselinePath: join(workdir, 'unused.json'), args: ['--update'],
  });

  assert.equal(code, 2);
});
