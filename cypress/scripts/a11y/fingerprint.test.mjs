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
