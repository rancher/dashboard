#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Baseline-diff gate for `vue-tsc` type errors.
 *
 * The repo carries a large number of pre-existing type errors, so a plain
 * "fail on any error" gate is not yet viable. Instead this script compares the
 * current set of type errors against a committed baseline and fails CI only on
 * NEW errors, letting us ratchet the count down over time without blocking
 * unrelated work.
 *
 * Each error is normalised to a signature of `file: error TSxxxx: message`
 * (line/column numbers are stripped) so that simply moving code around does not
 * register as a new error. Identical errors are compared as a multiset, so a
 * second occurrence of an existing error in the same file is still caught.
 *
 * Usage:
 *   node scripts/type-check-diff.mjs            # check against baseline (CI)
 *   node scripts/type-check-diff.mjs --update   # regenerate the baseline
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const BASELINE_PATH = path.join(REPO_ROOT, 'scripts', 'type-check-baseline.txt');
const TSCONFIG = 'tsconfig.type-check.json';

const isUpdate = process.argv.includes('--update');

// Matches: shell/utils/versions.ts(1,10): error TS2724: <message>
const ERROR_RE = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;

/**
 * Run vue-tsc and return its combined output.
 * @returns {string} The combined stdout and stderr emitted by vue-tsc.
 */
function runTypeCheck() {
  const bin = path.join(REPO_ROOT, 'node_modules', '.bin', 'vue-tsc');

  const result = spawnSync(bin, ['--noEmit', '-p', TSCONFIG], {
    cwd:       REPO_ROOT,
    encoding:  'utf8',
    env:       { ...process.env, NODE_OPTIONS: '--max_old_space_size=8192' },
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.error) {
    console.error('Failed to run vue-tsc:', result.error.message);
    process.exit(2);
  }

  return `${ result.stdout || '' }${ result.stderr || '' }`;
}

/**
 * Parse output into an array of normalised error signatures (one per error).
 * @param {string} output The combined vue-tsc output to scan for error lines.
 * @returns {string[]} Sorted `file: error TSxxxx: message` signatures, one per error occurrence.
 */
function parseSignatures(output) {
  const signatures = [];

  for (const line of output.split('\n')) {
    const match = ERROR_RE.exec(line.trimEnd());

    if (match) {
      const [, file, , , code, message] = match;

      signatures.push(`${ file }: error ${ code }: ${ message }`);
    }
  }

  return signatures.sort();
}

/**
 * Build a count map from an array of signatures.
 * @param {string[]} signatures The error signatures to tally.
 * @returns {Map<string, number>} A map of each signature to its number of occurrences.
 */
function toCounts(signatures) {
  const counts = new Map();

  for (const sig of signatures) {
    counts.set(sig, (counts.get(sig) || 0) + 1);
  }

  return counts;
}

/**
 * Read the committed baseline, exiting if it is missing.
 * @returns {string[]} The baseline error signatures, excluding blank and comment lines.
 */
function readBaseline() {
  if (!existsSync(BASELINE_PATH)) {
    console.error(`No baseline found at ${ path.relative(REPO_ROOT, BASELINE_PATH) }.`);
    console.error('Generate one with: yarn type-check:baseline');
    process.exit(2);
  }

  return readFileSync(BASELINE_PATH, 'utf8')
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l && !l.startsWith('#'));
}

const signatures = parseSignatures(runTypeCheck());

if (isUpdate) {
  const header = [
    '# Auto-generated type-check baseline. Do not edit by hand.',
    '# Regenerate with: yarn type-check:baseline',
    `# Total errors: ${ signatures.length }`,
    '',
  ].join('\n');

  writeFileSync(BASELINE_PATH, `${ header }${ signatures.join('\n') }\n`);
  console.log(`Wrote baseline with ${ signatures.length } errors to ${ path.relative(REPO_ROOT, BASELINE_PATH) }`);
  process.exit(0);
}

const baseline = readBaseline();
const baseCounts = toCounts(baseline);
const currentCounts = toCounts(signatures);

const newErrors = [];

for (const [sig, count] of currentCounts) {
  const delta = count - (baseCounts.get(sig) || 0);

  for (let i = 0; i < delta; i++) {
    newErrors.push(sig);
  }
}

let fixedCount = 0;

for (const [sig, count] of baseCounts) {
  fixedCount += Math.max(0, count - (currentCounts.get(sig) || 0));
}

console.log(`Type errors — baseline: ${ baseline.length }, current: ${ signatures.length }`);

if (fixedCount > 0) {
  console.log(`✔ ${ fixedCount } baseline error(s) no longer present. Consider running 'yarn type-check:baseline' to lock in the improvement.`);
}

if (newErrors.length > 0) {
  console.error(`\n✖ ${ newErrors.length } new type error(s) introduced:\n`);
  for (const sig of newErrors.sort()) {
    console.error(`  ${ sig }`);
  }
  console.error('\nFix the errors above, or if intentional, run \'yarn type-check:baseline\' and commit the updated baseline.');
  process.exit(1);
}

console.log('✔ No new type errors.');
process.exit(0);
