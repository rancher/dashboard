// Currently loading these rules with the --rulesdir argument. In the future we could make use of `eslint-plugin-local-rules`.
const vueUtils = require('eslint-plugin-vue/lib/utils');

module.exports = {
  meta: {
    type:   'problem',
    docs:   { description: 'We want to use `v-clean-tooltip` instead of `v-tooltip` in most all areas to avoid XSS exploits.' },
    schema: [],
  },
  create(context) {
    return vueUtils.defineTemplateBodyVisitor(context, {
      VAttribute(node) {
        // v-tooltip is a VDirectiveKey
        if (node?.key?.type !== 'VDirectiveKey') {
          return;
        }

        // v-tooltip is also a VIdentifier
        if (node.key.name.type !== 'VIdentifier') {
          return;
        }

        if (node.key.name.name === 'tooltip') {
          context.report({
            node:    node.key,
            loc:     node.loc,
            message: 'We want to use `v-clean-tooltip` instead of `v-tooltip` in most all areas to avoid XSS exploits.'
          });
        }
      }
    });
  }
};
