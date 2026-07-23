const vueUtils = require('eslint-plugin-vue/lib/utils');

module.exports = {
  meta: {
    type:   'problem',
    docs:   { description: 'Use <RcSeparator> instead of bare <hr> elements. For menu separators, use <RcDropdownSeparator>.' },
    schema: [],
  },
  create(context) {
    return vueUtils.defineTemplateBodyVisitor(context, {
      VElement(node) {
        if (node.rawName === 'hr') {
          context.report({
            node,
            loc:     node.loc,
            message: 'Use <RcSeparator> instead of <hr>. For menu/listbox separators use <RcDropdownSeparator>.'
          });
        }
      }
    });
  }
};
