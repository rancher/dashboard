const vueUtilsModule = require('eslint-plugin-vue/dist/utils');
const vueUtils = vueUtilsModule.default || vueUtilsModule;
const {
  DESIGN_SYSTEM_FILE, STORYBOOK_URL, findInString, message
} = require('./color-literals');

const NON_COLOR_ATTRIBUTES = new Set(['href', 'to', 'id', 'for', 'name', 'target']);

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: `Disallow hard-coded colors; use the design system tokens in ${ DESIGN_SYSTEM_FILE }.`,
      url:         STORYBOOK_URL,
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;

    const check = (node, range) => {
      const text = sourceCode.text.slice(range[0], range[1]);

      for (const { index, raw } of findInString(text)) {
        context.report({
          node,
          loc: {
            start: sourceCode.getLocFromIndex(range[0] + index),
            end:   sourceCode.getLocFromIndex(range[0] + index + raw.length),
          },
          message: message(raw),
        });
      }
    };

    const scriptVisitor = {
      Literal(node) {
        if (typeof node.value === 'string') {
          check(node, node.range);
        }
      },
      TemplateElement(node) {
        check(node, node.range);
      },
    };

    return vueUtils.defineTemplateBodyVisitor(context, {
      ...scriptVisitor,
      'VAttribute[directive=false]'(node) {
        if (node.value && !NON_COLOR_ATTRIBUTES.has(node.key.rawName.toLowerCase())) {
          check(node.value, node.value.range);
        }
      },
    }, scriptVisitor);
  },
};
