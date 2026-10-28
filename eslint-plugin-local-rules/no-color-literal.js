const vueUtilsModule = require('eslint-plugin-vue/dist/utils');
const vueUtils = vueUtilsModule.default || vueUtilsModule;
const {
  findInString, message, isNamedColor, isColorProperty
} = require('./color-literals');

const NON_COLOR_ATTRIBUTES = new Set(['href', 'to', 'id', 'for', 'name', 'target']);
const COLOR_ATTRIBUTES = new Set(['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color', 'color']);

module.exports = {
  meta: {
    type:   'problem',
    docs:   { description: 'Disallow hard-coded and computed colors; use theme variables.' },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;

    const report = (node, loc, raw) => {
      context.report({
        node, loc, message: message(raw)
      });
    };

    const check = (node, range) => {
      const text = sourceCode.text.slice(range[0], range[1]);

      for (const { index, raw } of findInString(text)) {
        report(node, {
          start: sourceCode.getLocFromIndex(range[0] + index),
          end:   sourceCode.getLocFromIndex(range[0] + index + raw.length),
        }, raw);
      }
    };

    const checkNamed = (node, value) => {
      if (typeof value === 'string' && isNamedColor(value.trim())) {
        report(node, node.loc, value.trim());
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
      Property(node) {
        const key = node.key.type === 'Identifier' ? node.key.name : node.key.value;

        if (!node.computed && typeof key === 'string' && isColorProperty(key) && node.value.type === 'Literal') {
          checkNamed(node.value, node.value.value);
        }
      },
    };

    return vueUtils.defineTemplateBodyVisitor(context, {
      ...scriptVisitor,
      'VAttribute[directive=false]'(node) {
        const name = node.key.rawName.toLowerCase();

        if (node.value && !NON_COLOR_ATTRIBUTES.has(name)) {
          check(node.value, node.value.range);
        }
        if (node.value && COLOR_ATTRIBUTES.has(name)) {
          checkNamed(node.value, node.value.value);
        }
      },
    }, scriptVisitor);
  },
};
