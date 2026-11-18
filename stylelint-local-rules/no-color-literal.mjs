/**
 * Stylelint rule `local-rules/no-color-literal`: colors in stylesheets and `<style>` blocks come from theme
 * variables, not written out or computed from other colors.
 */
import stylelint from 'stylelint';
import colorLiterals from '../eslint-plugin-local-rules/color-literals.js';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;
const { findInCss, message } = colorLiterals;

const ruleName = 'local-rules/no-color-literal';
const messages = ruleMessages(ruleName, { rejected: (raw) => message(raw) });

const rule = (primary) => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary })) {
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

export default createPlugin(ruleName, rule);
