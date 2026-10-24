const vueUtilsModule = require('eslint-plugin-vue/dist/utils');
const vueUtils = vueUtilsModule.default || vueUtilsModule;
const {
  DESIGN_SYSTEM_FILE, STORYBOOK_URL, findInString, message, isNamedColor, isColorProperty
} = require('./color-literals');

const NON_COLOR_ATTRIBUTES = new Set(['href', 'to', 'id', 'for', 'name', 'target']);
const COLOR_ATTRIBUTES = new Set(['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color', 'color']);
const DISABLE_NEXT_LINE = /^\s*eslint-disable-next-line\s+([^\n]*?)\s*(?:--[\s\S]*)?$/;

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
    const reportedLines = new Set();
    let pragmasChecked = false;

    const report = (node, loc, raw) => {
      reportedLines.add(loc.start.line);
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

    const checkPragmas = () => {
      if (pragmasChecked) {
        return;
      }
      pragmasChecked = true;

      for (const comment of [...sourceCode.getAllComments(), ...sourceCode.ast.templateBody?.comments || []]) {
        const rules = comment.value.match(DISABLE_NEXT_LINE)?.[1].split(/\s*,\s*/) || [];

        if (rules.includes(context.id) && !reportedLines.has(comment.loc.end.line + 1)) {
          context.report({ loc: comment.loc, message: `Unused ${ context.id } disable: the next line has no hard-coded color, so remove it.` });
        }
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
      'Program:exit'() {
        if (!sourceCode.ast.templateBody) {
          checkPragmas();
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
      'VElement:exit'(node) {
        if (node === sourceCode.ast.templateBody) {
          checkPragmas();
        }
      },
    }, scriptVisitor);
  },
};
