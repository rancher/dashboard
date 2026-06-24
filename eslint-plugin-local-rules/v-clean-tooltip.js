module.exports = {
  meta: {
    type:   'problem',
    docs:   { description: 'We want to use `v-clean-tooltip` instead of `v-tooltip` in most all areas to avoid XSS exploits.' },
    schema: [],
  },
  create(context) {
    // `vue-eslint-parser` exposes `defineTemplateBodyVisitor` via parserServices at runtime.
    // (eslint-plugin-vue v10 removed the `eslint-plugin-vue/lib/utils` re-export this used to use.)
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const parserServices = sourceCode.parserServices ?? context.parserServices;

    if (!parserServices?.defineTemplateBodyVisitor) {
      return {};
    }

    return parserServices.defineTemplateBodyVisitor({
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
