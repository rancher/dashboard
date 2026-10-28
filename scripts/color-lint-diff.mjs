#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Baseline-diff gate for hard-coded and computed colors in shell and @rancher/components.
 *
 * Runs `local-rules/no-color-literal` (ESLint for scripts and templates, stylelint for stylesheets and
 * `<style>` blocks) and fails only on colors that are not in the committed baseline.
 *
 * The baseline lists each color as `file:line: color`. Colors are matched by file and color, as a multiset,
 * so moving code does not register as a new color, while a second copy of a baselined color in the same
 * file does.
 *
 * Usage:
 *   node scripts/color-lint-diff.mjs            # check against baseline (CI)
 *   node scripts/color-lint-diff.mjs --update   # regenerate the baseline
 */

import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../..');
const BASELINE_PATH = path.join(REPO_ROOT, 'scripts', 'color-lint-baseline.txt');
const RULE = 'local-rules/no-color-literal';
const SCOPES = ['shell', 'pkg/rancher-components'];
const ENTRY_RE = /^(.+?):(\d+): (.*)$/;

const relative = (file) => path.relative(REPO_ROOT, file).split(path.sep).join('/');
const keyOf = ({ file, color }) => `${ file }\0${ color }`;

async function findColors() {
  const [{ ESLint }, { default: stylelint }, { testFiles }, { default: stylelintConfig }, { default: colorLiterals }] = await Promise.all([
    import('eslint'),
    import('stylelint'),
    import('../eslint.config.base.mjs'),
    import('../stylelint.config.mjs'),
    import('../eslint-plugin-local-rules/color-literals.js'),
  ]);
  const colorOf = (text) => colorLiterals.colorInMessage(text) ?? text;

  const eslint = new ESLint({
    cwd:            REPO_ROOT,
    overrideConfig: {
      files: ['**/*.{js,ts,vue}'], ignores: testFiles, rules: { [RULE]: 'error' }
    },
    ruleFilter: ({ ruleId }) => ruleId === RULE,
  });
  const eslintResults = await eslint.lintFiles(SCOPES);

  const { results: stylelintResults } = await stylelint.lint({
    files:         SCOPES.map((scope) => `${ scope }/**/*.{vue,scss,css}`),
    cwd:           REPO_ROOT,
    configBasedir: REPO_ROOT,
    config:        {
      ...stylelintConfig, plugins: ['./stylelint-local-rules/no-color-literal.mjs'], rules: { [RULE]: true }
    },
  });

  const colors = [
    ...eslintResults.flatMap((result) => result.messages
      .filter((m) => m.ruleId === RULE)
      .map((m) => ({
        file: relative(result.filePath), line: m.line, color: colorOf(m.message)
      }))),
    ...stylelintResults.flatMap((result) => result.warnings
      .filter((w) => w.rule === RULE)
      .map((w) => ({
        file: relative(result.source), line: w.line, color: colorOf(w.text)
      }))),
  ];

  return colors.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.color.localeCompare(b.color));
}

/**
 * Render colors as baseline lines.
 * @param {{ file: string, line: number, color: string }[]} colors The colors to list.
 * @returns {string[]} One `file:line: color` line per color.
 */
export function formatEntries(colors) {
  return colors.map(({ file, line, color }) => `${ file }:${ line }: ${ color }`);
}

/**
 * Parse baseline text into colors, skipping blank and comment lines.
 * @param {string} text The baseline file contents.
 * @returns {{ file: string, line: number, color: string }[]} The baselined colors.
 */
export function parseBaseline(text) {
  return text.split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [, file, line, color] = ENTRY_RE.exec(l) || [];

      if (!file) {
        throw new Error(`Malformed baseline line: ${ l }`);
      }

      return {
        file, line: Number(line), color
      };
    });
}

/**
 * Compare the colors found against the baseline, matching on file and color.
 * @param {{ file: string, color: string }[]} baseline The baselined colors.
 * @param {{ file: string, line: number, color: string }[]} current The colors found now.
 * @returns {{ added: { file: string, color: string, lines: number[], allowed: number }[], newCount: number, fixedCount: number }}
 *   Each file and color found more often than the baseline allows (with every line it is on now), how many
 *   colors that adds up to, and how many baselined colors are gone.
 */
export function compare(baseline, current) {
  const allowed = new Map();
  const found = new Map();

  for (const color of baseline) {
    allowed.set(keyOf(color), (allowed.get(keyOf(color)) || 0) + 1);
  }
  for (const color of current) {
    const entry = found.get(keyOf(color)) || {
      file: color.file, color: color.color, lines: []
    };

    entry.lines.push(color.line);
    found.set(keyOf(color), entry);
  }

  const added = [];
  let newCount = 0;
  let fixedCount = 0;

  for (const [key, entry] of found) {
    const delta = entry.lines.length - (allowed.get(key) || 0);

    if (delta > 0) {
      added.push({ ...entry, allowed: allowed.get(key) || 0 });
      newCount += delta;
    }
  }
  for (const [key, count] of allowed) {
    fixedCount += Math.max(0, count - (found.get(key)?.lines.length || 0));
  }

  return {
    added, newCount, fixedCount
  };
}

function readBaseline() {
  if (!existsSync(BASELINE_PATH)) {
    console.error(`No baseline found at ${ relative(BASELINE_PATH) }.`);
    console.error('Generate one with: yarn lint:colors:baseline');
    process.exit(2);
  }

  return parseBaseline(readFileSync(BASELINE_PATH, 'utf8'));
}

async function main() {
  const colors = await findColors();

  if (process.argv.includes('--update')) {
    const header = [
      '# Auto-generated color lint baseline. Do not edit by hand.',
      '# Regenerate with: yarn lint:colors:baseline',
      `# Total colors: ${ colors.length }`,
      '',
    ].join('\n');

    writeFileSync(BASELINE_PATH, `${ header }${ formatEntries(colors).join('\n') }\n`);
    console.log(`Wrote baseline with ${ colors.length } colors to ${ relative(BASELINE_PATH) }`);
    process.exit(0);
  }

  const baseline = readBaseline();
  const { added, newCount, fixedCount } = compare(baseline, colors);

  console.log(`Colors: baseline ${ baseline.length }, current ${ colors.length }`);

  if (fixedCount > 0) {
    console.log(`✔ ${ fixedCount } baseline color(s) no longer present. Consider running 'yarn lint:colors:baseline' to lock in the improvement.`);
  }

  if (newCount > 0) {
    console.error(`\n✖ ${ newCount } new color(s) introduced:\n`);
    for (const { file, color, lines, allowed } of added) {
      if (allowed) {
        console.error(`  ${ file }: ${ color } on lines ${ lines.join(', ') } (the baseline allows ${ allowed })`);
      } else {
        lines.forEach((line) => console.error(`  ${ file }:${ line }: ${ color }`));
      }
    }
    console.error('\nUse a theme variable, such as var(--primary), instead. If you decide to add the color, check with UX before adding it and giving it a name, then run \'yarn lint:colors:baseline\' and commit the updated baseline.');
    process.exit(1);
  }

  console.log('✔ No new colors.');
  process.exit(0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('Failed to run the color lint:', err);
    process.exit(2);
  });
}
