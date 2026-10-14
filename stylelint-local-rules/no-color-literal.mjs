/**
 * Stylelint rule `local-rules/no-color-literal`: colors in stylesheets and `<style>` blocks must come from
 * the design system tokens (`var(--color-*)`), not be written out or computed from other colors.
 *
 * Options: `[true, { baseline: 'stylelint-color-baseline.json' }]`. The baseline lists the colors each file
 * already had when the rule was introduced; only colors beyond it are reported, so existing code passes
 * while new colors fail. A color removed from a file must also leave the baseline, so the rule reports
 * stale entries; `yarn lint:colors:prune` removes them, and entries for deleted files, and only ever
 * shrinks the baseline. `UPDATE_COLOR_BASELINE=all` records every color in the files it lints, e.g. after
 * renaming one.
 */
import fs from 'node:fs';
import path from 'node:path';
import stylelint from 'stylelint';
import colorLiterals from '../eslint-plugin-local-rules/color-literals.js';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;
const {
  REPO_ROOT, DESIGN_SYSTEM_DIR, STORYBOOK_URL, findInCss, message
} = colorLiterals;

const ruleName = 'local-rules/no-color-literal';
const messages = ruleMessages(ruleName, {
  rejected: (raw) => message(raw),
  stale:    (colors) => `stylelint-color-baseline.json still lists ${ colors } for this file, which it no longer has: run yarn lint:colors:prune`,
});
const updating = process.env.UPDATE_COLOR_BASELINE;
const baselines = new Map();
const collected = new Map();
const perFile = new WeakMap();

const normalize = (raw) => raw.toLowerCase().replace(/\s+/g, ' ');

function readBaseline(file) {
  const full = path.join(REPO_ROOT, file);
  const modified = fs.existsSync(full) ? fs.statSync(full).mtimeMs : 0;

  if (baselines.get(file)?.modified !== modified) {
    baselines.set(file, { modified, data: modified ? JSON.parse(fs.readFileSync(full, 'utf8')) : {} });
  }

  return baselines.get(file).data;
}

function writeBaselines() {
  for (const [file, counts] of collected) {
    const baseline = readBaseline(file);

    for (const [source, current] of counts) {
      const colors = updating === 'all' ? current : Object.fromEntries(Object.entries(current)
        .map(([color, count]) => [color, Math.min(count, baseline[source]?.[color] || 0)])
        .filter(([, count]) => count > 0));

      if (Object.keys(colors).length) {
        baseline[source] = Object.fromEntries(Object.entries(colors).sort());
      } else {
        delete baseline[source];
      }
    }
    for (const source of Object.keys(baseline)) {
      if (!fs.existsSync(path.join(REPO_ROOT, source))) {
        delete baseline[source];
      }
    }
    const sorted = Object.fromEntries(Object.keys(baseline).sort().map((key) => [key, baseline[key]]));

    fs.writeFileSync(path.join(REPO_ROOT, file), `${ JSON.stringify(sorted, null, 2) }\n`);
  }
}

if (updating) {
  process.once('exit', writeBaselines);
}

const rule = (primary, secondary) => (root, result) => {
  const valid = validateOptions(result, ruleName, { actual: primary }, {
    actual:   secondary,
    possible: { baseline: [(v) => typeof v === 'string'] },
    optional: true,
  });
  const file = root.source?.input?.file;

  if (!valid || !file) {
    return;
  }
  const source = path.relative(REPO_ROOT, file).split(path.sep).join('/');

  if (source.startsWith(`${ DESIGN_SYSTEM_DIR }/`)) {
    return;
  }
  const found = [];

  root.walkDecls((decl) => {
    const value = decl.raws.value?.raw ?? decl.value;
    const offset = decl.prop.length + (decl.raws.between || '').length;

    for (const { index, raw } of findInCss(value, decl.prop)) {
      found.push({
        node: decl, index: offset + index, raw
      });
    }
  });
  root.walkAtRules(/^(include|return)$/i, (atRule) => {
    const offset = atRule.name.length + 1 + (atRule.raws.afterName || '').length;

    for (const { index, raw } of findInCss(atRule.params)) {
      found.push({
        node: atRule, index: offset + index, raw
      });
    }
  });

  const baselineFile = secondary?.baseline;

  if (!perFile.has(result)) {
    perFile.set(result, updating ? {} : { ...(baselineFile ? readBaseline(baselineFile)[source] : undefined) });
  }
  const state = perFile.get(result);

  if (updating && baselineFile) {
    for (const { raw } of found) {
      state[normalize(raw)] = (state[normalize(raw)] || 0) + 1;
    }
    if (!collected.has(baselineFile)) {
      collected.set(baselineFile, new Map());
    }
    collected.get(baselineFile).set(source, state);

    return;
  }

  for (const { node, index, raw } of found) {
    if (state[normalize(raw)] > 0) {
      state[normalize(raw)]--;
      continue;
    }
    report({
      ruleName,
      result,
      node,
      index,
      endIndex: index + raw.length,
      message:  messages.rejected(raw),
    });
  }

  const lastRoot = root.document?.type !== 'document' || root.document.last === root;
  const stale = Object.entries(state).filter(([, count]) => count > 0);

  if (lastRoot && stale.length) {
    report({
      ruleName,
      result,
      node:     root.first || root,
      index:    0,
      endIndex: 1,
      message:  messages.stale(stale.map(([color, count]) => `${ color } x${ count }`).join(', ')),
    });
  }
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = { url: STORYBOOK_URL };

export default createPlugin(ruleName, rule);
