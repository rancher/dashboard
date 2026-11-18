// eslint-plugin-vue v10 ships its internals under `dist/` (was `lib/`) and wraps the
// CommonJS export in a `.default`. `defineTemplateBodyVisitor` has no public entry point,
// so reach into `dist/utils` — the v10 successor to the old `lib/utils` path.
const vueUtilsModule = require('eslint-plugin-vue/dist/utils');
const vueUtils = vueUtilsModule.default || vueUtilsModule;

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
            message: 'Use <RcSeparator> (import { RcSeparator } from \'@components/RcSeparator\') instead of <hr>. For menu/listbox separators use <RcDropdownSeparator>.'
          });
        }
      }
    });
  }
};
