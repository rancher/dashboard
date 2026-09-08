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
import { fingerprint, flatten, norm, normalizePath } from './fingerprint.mjs';

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

// --- generated-leaf normalisation -------------------------------------------
//
// The plugin appends `${parentTitle} (#n)` to every violation path. n renumbers as
// sibling checks gain/lose violating nodes, and the segment only appears at all when
// tidy() declines to collapse it — so a fingerprint that included it would move
// under the ratchet for reasons unrelated to accessibility.

const menuPath = ['shell.spec.ts', 'Shell a11y testing', 'Logged in', 'Menus', 'Burger Menu'];

test('normalizePath drops the auto-generated (#n) leaf', () => {
  assert.deepEqual(normalizePath([...menuPath, 'Burger Menu (#1)']), menuPath);
  assert.deepEqual(normalizePath([...menuPath, 'Burger Menu (#12)']), menuPath);
});

test('normalizePath keeps a segment that is not the parent name plus a counter', () => {
  // A caller-supplied description, even one shaped like the generated leaf.
  assert.deepEqual(normalizePath([...menuPath, 'Brand logo']), [...menuPath, 'Brand logo']);
  assert.deepEqual(normalizePath([...menuPath, 'Something else (#2)']), [...menuPath, 'Something else (#2)']);
});

test('normalizePath normalises whitespace and drops empty segments', () => {
  assert.deepEqual(normalizePath(['  a ', '', null, ' b  c ']), ['a', 'b c']);
  assert.deepEqual(normalizePath(undefined), []);
});

test('fingerprint is unchanged when tidy() stops collapsing the leaf', () => {
  // Today the leaf is collapsed away; it reappears the moment a second check in the
  // same `it` starts violating. Both forms must hash the same, or every already
  // accepted violation in that test would be re-reported as new.
  assert.equal(
    fingerprint(menuPath, 'listitem'),
    fingerprint([...menuPath, 'Burger Menu (#1)'], 'listitem'),
  );
});

test('fingerprint ignores the per-node counter', () => {
  // 'Product Side navigation' runs seven checks in a forEach; one extra violating
  // node in the first shifts the counter for the other six.
  const nav = ['shell.spec.ts', 'Shell a11y testing', 'Logged in', 'Menus', 'Product Side navigation'];

  assert.equal(
    fingerprint([...nav, 'Product Side navigation (#1)'], 'color-contrast'),
    fingerprint([...nav, 'Product Side navigation (#19)'], 'color-contrast'),
  );
});

test('flatten folds collapsed and un-collapsed forms of one test together', () => {
  const report = {
    stats:    { totalTests: 1 },
    children: [{
      name:       'shell.spec.ts',
      violations: [],
      children:   [{
        name:       'Burger Menu',
        // Violations hoisted by tidy() onto the parent...
        violations: [{ id: 'listitem', impact: 'serious', help: 'h' }],
        // ...and the same rule on a generated leaf that did not collapse.
        children:   [{
          name: 'Burger Menu (#2)', leaf: true, children: [], violations: [{ id: 'listitem', impact: 'serious', help: 'h' }],
        }],
      }],
    }],
  };

  const map = flatten(report);

  assert.equal(map.size, 1, 'both forms should share one fingerprint');
  assert.equal([...map.values()][0].where, 'shell.spec.ts > Burger Menu', 'where should not carry the generated leaf');
});
