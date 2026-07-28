// Shared helpers for the accessibility ratchet.
//
// The a11y report plugin (cypress/support/plugins/accessibility/index.ts) writes
// `cypress/accessibility/accessibility.json` shaped as:
//
//   { stats, children: TestViolation[] }
//   TestViolation = { name, children: TestViolation[], violations: axeViolation[], leaf, screenshot? }
//   axeViolation  = { id, impact, description, help, helpUrl, nodes: [{ target, html, ... }] }
//
// Violations live on leaf nodes (and, after the plugin's `tidy()` collapse, some
// intermediate nodes). We walk that tree and reduce each violation to a *coarse*
// fingerprint keyed on the test path + axe rule id — deliberately NOT the axe
// `target` selector, which contains positional/generated fragments that shift
// between runs and would make the ratchet flaky.
//
// ESM + node:crypto only: no external deps, so CI can run it with a bare `node`.

import { createHash } from 'node:crypto';

/** Collapse runs of whitespace and trim — mirrors the `.replace(/\s+/g, ' ')` the spec uses on titles. */
export const norm = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

// When a check is made without an explicit description, the a11y command names the
// node `<test title> (#<n>)` — see `testPath.push(description || ...)` in
// cypress/support/commands/accessiblity.ts. That <n> is a running count of violation
// *nodes* seen earlier in the same test, so it shifts whenever any earlier check in
// that test gains or loses a violation. Baking it into the fingerprint would mean
// fixing one violation renumbers every later check in the test and reports them all
// as brand new regressions.
const AUTO_CHECK_SUFFIX = /\s*\(#\d+\)$/;

/**
 * Is `name` the auto-generated per-check node for `parent` (i.e. `<parent> (#n)`)?
 * Explicit descriptions passed to checkPageAccessibility/checkElementAccessibility
 * are stable and deliberately left alone.
 *
 * @param {string} name   Candidate node name.
 * @param {string} parent Name of the node directly above it.
 * @returns {boolean}
 */
function isAutoCheckNode(name, parent) {
  const normalised = norm(name);

  return AUTO_CHECK_SUFFIX.test(normalised) && normalised.replace(AUTO_CHECK_SUFFIX, '') === norm(parent);
}

/**
 * Coarse, stable identity for a violation: the test path (spec > describe > ... > it)
 * plus the axe rule id. All instances of one rule on one page collapse to a single
 * fingerprint — this is a regression ceiling, not per-node bookkeeping.
 *
 * @param {string[]} path  Tree node names from the spec down to the violation-holding node.
 * @param {string}   ruleId axe violation id (e.g. 'color-contrast').
 * @returns {string} hex sha256.
 */
export function fingerprint(path, ruleId) {
  // ruleId is a fixed vocabulary of lowercase hyphenated axe ids (no spaces), so a
  // single space unambiguously separates it from the joined path.
  const key = `${ norm(path.join(' > ')) } ${ norm(ruleId).toLowerCase() }`;

  return createHash('sha256').update(key).digest('hex');
}

/**
 * Flatten the report tree into a de-duplicated map of fingerprint -> record.
 * De-duplication across the Map naturally folds together retries and any nodes
 * that collapse to the same (path, rule) pair.
 *
 * @param {{ children?: any[] }} report Parsed accessibility.json.
 * @returns {Map<string, { fingerprint: string, where: string, rule: string, impact: string, help: string }>}
 */
export function flatten(report) {
  const out = new Map();

  for (const spec of report?.children ?? []) {
    walk(spec, [], out);
  }

  return out;
}

function walk(node, ancestors, out) {
  // Drop auto-generated per-check nodes so they collapse onto their test. This also
  // makes multi-check tests agree with single-check ones, which the report plugin's
  // tidy() already collapses to the bare test title.
  const isAutoCheck = isAutoCheckNode(node?.name, ancestors[ancestors.length - 1]);
  const path = isAutoCheck ? [...ancestors] : [...ancestors, node?.name].filter(Boolean);

  for (const violation of node?.violations ?? []) {
    const fp = fingerprint(path, violation.id);

    if (!out.has(fp)) {
      out.set(fp, {
        fingerprint: fp,
        where:       path.join(' > '),
        rule:        violation.id,
        impact:      violation.impact ?? 'unknown',
        help:        violation.help ?? '',
      });
    }
  }

  for (const child of node?.children ?? []) {
    walk(child, path, out);
  }
}
