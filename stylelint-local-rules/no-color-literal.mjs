/**
 * Stylelint rule `local-rules/no-color-literal`: colors in stylesheets and `<style>` blocks must come from
 * the design system tokens (`var(--color-*)`), not be written out or computed from other colors.
 */
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
const messages = ruleMessages(ruleName, { rejected: (raw) => message(raw) });

const rule = (primary) => (root, result) => {
  const valid = validateOptions(result, ruleName, { actual: primary });
  const file = root.source?.input?.file;

  if (!valid || !file) {
    return;
  }
  const source = path.relative(REPO_ROOT, file).split(path.sep).join('/');

  if (source.startsWith(`${ DESIGN_SYSTEM_DIR }/`)) {
    return;
  }
  const check = (node, offset, value, property) => {
    for (const { index, raw } of findInCss(value, property)) {
      report({
        ruleName,
        result,
        node,
        index:    offset + index,
        endIndex: offset + index + raw.length,
        message:  messages.rejected(raw),
      });
    }
  };

  root.walkDecls((decl) => {
    check(decl, decl.prop.length + (decl.raws.between || '').length, decl.raws.value?.raw ?? decl.value, decl.prop);
  });
  root.walkAtRules(/^(include|return)$/i, (atRule) => {
    check(atRule, atRule.name.length + 1 + (atRule.raws.afterName || '').length, atRule.params);
  });
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = { url: STORYBOOK_URL };

export default createPlugin(ruleName, rule);
