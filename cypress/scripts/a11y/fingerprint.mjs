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
// The test path needs the same treatment: see `normalizePath` below, which drops
// the auto-generated `${parent} (#n)` leaf the plugin appends. Without that the
// path carries a per-node counter and a collapse-dependent extra segment, which
// reintroduces exactly the instability the coarse fingerprint exists to avoid.
//
// ESM + node:crypto only: no external deps, so CI can run it with a bare `node`.

import { createHash } from 'node:crypto';

/** Collapse runs of whitespace and trim — mirrors the `.replace(/\s+/g, ' ')` the spec uses on titles. */
export const norm = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

// The plugin appends an auto-generated leaf segment to every violation path:
// `${parentTitle} (#${n})`, where n is a screenshot counter incremented once per
// violating node (cypress/support/commands/accessiblity.ts). Both halves of that
// segment are unstable:
//
//   - n renumbers whenever an earlier check in the same `it` gains or loses a
//     violating node, so unrelated violations churn. The worst case is the seven
//     `checkElementAccessibility` calls in one `forEach` in 'Product Side
//     navigation', where a single new node shifts the other six.
//   - the segment survives into the path at all only when the plugin's `tidy()`
//     declines to collapse it, and that flips the first time a second check in the
//     same test starts violating — silently rewriting the path of an already
//     accepted violation, which the ratchet would then read as a new one.
//
// Dropping it makes the collapsed and un-collapsed forms hash identically, which is
// what the coarse "one rule on one page" ceiling wants anyway. The segment is only
// dropped when it is genuinely the parent's name plus a counter, so a caller-supplied
// description (`checkElementAccessibility(el, 'Some name')`) is left alone.
const GENERATED_LEAF_RE = /^(.*) \(#\d+\)$/;

/**
 * Normalise each path segment and drop the plugin's auto-generated `(#n)` leaf.
 *
 * @param {string[]} path Raw tree node names, spec first.
 * @returns {string[]} Normalised segments with generated leaves removed.
 */
export function normalizePath(path) {
  const out = [];

  for (const raw of path ?? []) {
    const segment = norm(raw);

    if (!segment) {
      continue;
    }

    const match = GENERATED_LEAF_RE.exec(segment);

    if (match && out.length && match[1] === out[out.length - 1]) {
      continue;
    }

    out.push(segment);
  }

  return out;
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
  const key = `${ normalizePath(path).join(' > ') } ${ norm(ruleId).toLowerCase() }`;

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
  const path = [...ancestors, node?.name].filter(Boolean);
  // `where` has to agree with what the fingerprint hashed, otherwise a baseline
  // entry would display a path that no longer regenerates to its own fingerprint.
  const where = normalizePath(path).join(' > ');

  for (const violation of node?.violations ?? []) {
    const fp = fingerprint(path, violation.id);

    if (!out.has(fp)) {
      out.set(fp, {
        fingerprint: fp,
        where,
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
