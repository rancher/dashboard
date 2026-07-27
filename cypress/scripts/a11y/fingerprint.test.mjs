// Unit tests for the a11y ratchet fingerprinting.
//
// Uses the built-in Node test runner (node:test) rather than Jest: the repo's
// jest.config.js excludes `<rootDir>/cypress/` via modulePathIgnorePatterns, so a
// Jest spec here would never run. Node 24 ships node:test, so this stays
// dependency-free and colocated with the code it covers.
//
//   node --test cypress/scripts/a11y/        (or: yarn a11y:test)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fingerprint, flatten, norm } from './fingerprint.mjs';

// A trimmed-down shape mirroring what the a11y plugin writes to accessibility.json.
const sampleReport = {
  stats:    { totalTests: 3, totalPassed: 3 },
  children: [
    {
      name:       'shell.spec.ts',
      violations: [],
      children:   [
        {
          name:       'Login page',
          violations: [],
          children:   [
            {
              name:       'login page',
              leaf:       true,
              children:   [],
              violations: [
                {
                  id: 'color-contrast', impact: 'serious', help: 'Elements must meet contrast', nodes: [{ target: ['.a'] }, { target: ['.b'] }],
                },
                {
                  id: 'label', impact: 'critical', help: 'Form elements must have labels', nodes: [{ target: ['#x'] }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

test('norm collapses whitespace and trims', () => {
  assert.equal(norm('  API   Key:  Create '), 'API Key: Create');
  assert.equal(norm(undefined), '');
  assert.equal(norm(null), '');
});

test('fingerprint is stable and case/whitespace-insensitive on the rule id', () => {
  const a = fingerprint(['shell.spec.ts', 'Login page', 'login page'], 'color-contrast');
  const b = fingerprint(['shell.spec.ts', 'Login page', 'login page'], 'COLOR-CONTRAST');
  const c = fingerprint(['shell.spec.ts', 'Login page', 'login page'], 'color-contrast');

  assert.equal(a, b, 'rule id should be lowercased before hashing');
  assert.equal(a, c, 'same inputs produce the same hash');
  assert.match(a, /^[0-9a-f]{64}$/);
});

test('fingerprint differs by page and by rule (coarse: page + rule only)', () => {
  const contrastLogin = fingerprint(['shell.spec.ts', 'Login page'], 'color-contrast');
  const contrastHome = fingerprint(['shell.spec.ts', 'Home page'], 'color-contrast');
  const labelLogin = fingerprint(['shell.spec.ts', 'Login page'], 'label');

  assert.notEqual(contrastLogin, contrastHome, 'different page => different fingerprint');
  assert.notEqual(contrastLogin, labelLogin, 'different rule => different fingerprint');
});

test('flatten collapses multiple nodes of one rule on a page into a single record', () => {
  const map = flatten(sampleReport);

  // Two rules on one page (color-contrast has 2 nodes but collapses to one entry).
  assert.equal(map.size, 2);

  const records = [...map.values()];
  const rules = records.map((r) => r.rule).sort();

  assert.deepEqual(rules, ['color-contrast', 'label']);

  const contrast = records.find((r) => r.rule === 'color-contrast');

  assert.equal(contrast.impact, 'serious');
  assert.equal(contrast.where, 'shell.spec.ts > Login page > login page');
});

test('flatten is empty for a report with no violations', () => {
  assert.equal(flatten({ children: [] }).size, 0);
  assert.equal(flatten({}).size, 0);
});

/**
 * Build a report for a test that runs several a11y checks. The a11y command names
 * each check `<test title> (#<n>)`, where n counts violation *nodes* seen earlier in
 * the test — so the numbering shifts as violations come and go.
 *
 * @param {number[]} indexes The `(#n)` values the run happened to produce.
 * @param {string}   rule    axe rule id to report at each check.
 */
const multiCheckReport = (indexes, rule = 'color-contrast') => ({
  stats:    { totalTests: 1 },
  children: [{
    name:       'shell.spec.ts',
    violations: [],
    children:   [{
      name:       'Product Side navigation',
      violations: [],
      children:   indexes.map((n) => ({
        name:       `Product Side navigation (#${ n })`,
        leaf:       true,
        children:   [],
        violations: [{
          id: rule, impact: 'serious', help: 'h'
        }],
      })),
    }],
  }],
});

test('the auto-generated (#n) check counter does not affect the fingerprint', () => {
  // Same violations, but an earlier check gained a node so everything renumbered.
  const before = flatten(multiCheckReport([1, 4, 7, 10]));
  const after = flatten(multiCheckReport([1, 5, 9, 13]));

  assert.deepEqual([...after.keys()], [...before.keys()], 'renumbering must not produce new fingerprints');
});

test('checks within one test collapse onto the test, matching tidy()-collapsed single-check tests', () => {
  const multi = flatten(multiCheckReport([1, 4, 7]));

  assert.equal(multi.size, 1, 'one rule across several checks is one fingerprint');
  assert.equal([...multi.values()][0].where, 'shell.spec.ts > Product Side navigation');

  // A test doing a single check is collapsed by the report plugin's tidy() before it
  // ever reaches us, so it arrives without the (#n) node. Both shapes must agree —
  // otherwise adding a second check to a test invalidates its baseline entries.
  const single = flatten({
    stats:    { totalTests: 1 },
    children: [{
      name:       'shell.spec.ts',
      violations: [],
      children:   [{
        name:       'Product Side navigation',
        leaf:       true,
        children:   [],
        violations: [{
          id: 'color-contrast', impact: 'serious', help: 'h'
        }],
      }],
    }],
  });

  assert.deepEqual([...single.keys()], [...multi.keys()]);
});

test('explicit check descriptions are preserved', () => {
  // A description passed to checkPageAccessibility is stable, so it stays in the path
  // and keeps distinct checks distinct.
  const map = flatten({
    stats:    { totalTests: 1 },
    children: [{
      name:       'shell.spec.ts',
      violations: [],
      children:   [{
        name:       'Import YAML',
        violations: [],
        children:   ['dialog open', 'dialog closed'].map((description) => ({
          name:       description,
          leaf:       true,
          children:   [],
          violations: [{
            id: 'label', impact: 'critical', help: 'h'
          }],
        })),
      }],
    }],
  });

  assert.equal(map.size, 2);
  assert.deepEqual([...map.values()].map((r) => r.where).sort(), [
    'shell.spec.ts > Import YAML > dialog closed',
    'shell.spec.ts > Import YAML > dialog open',
  ]);
});

test('a (#n) node is only dropped when it belongs to its parent test', () => {
  // Defensive: a genuine title that merely ends in (#n) but does not match its parent
  // is not the command's auto-generated node, so it must survive.
  const map = flatten({
    stats:    { totalTests: 1 },
    children: [{
      name:       'shell.spec.ts',
      violations: [],
      children:   [{
        name:       'Some page',
        violations: [],
        children:   [{
          name:       'Unrelated title (#2)',
          leaf:       true,
          children:   [],
          violations: [{
            id: 'label', impact: 'critical', help: 'h'
          }],
        }],
      }],
    }],
  });

  assert.equal([...map.values()][0].where, 'shell.spec.ts > Some page > Unrelated title (#2)');
});
