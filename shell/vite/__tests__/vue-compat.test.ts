import { vueParenthesisedDefaultExport } from '@shell/vite/vue-compat.mjs';

const transform = (code: string, id = '/pkg/thing/Thing.vue') => (vueParenthesisedDefaultExport() as any).transform(code, id);

describe('fx: vueParenthesisedDefaultExport', () => {
  it('should export parenthesised component options through a constant', () => {
    const code = `<script>\nexport default ({\n  name: 'Thing',\n});\n</script>\n\n<template><div /></template>\n`;

    expect(transform(code).code).toStrictEqual(`<script>\nconst __rancher_sfc_default__ = ({\n  name: 'Thing',\n});\n;export default __rancher_sfc_default__;</script>\n\n<template><div /></template>\n`);
  });

  it('should export the options when the script ends with a comment', () => {
    const code = `<script>\nexport default ({\n  name: 'Thing',\n}); // the thing\n</script>\n`;

    expect(transform(code).code).toStrictEqual(`<script>\nconst __rancher_sfc_default__ = ({\n  name: 'Thing',\n}); // the thing\n;export default __rancher_sfc_default__;</script>\n`);
  });

  it('should keep the code on the lines it was on', () => {
    const code = `<script>\nexport default ({\n  name: 'Thing',\n});\n</script>\n<template><div /></template>\n`;

    expect(transform(code).code.split('\n')).toHaveLength(code.split('\n').length);
  });

  it.each([
    ['options without parentheses', `<script>\nexport default {\n  name: 'Thing',\n};\n</script>\n`, '/pkg/thing/Thing.vue'],
    ['a setup script', `<script setup>\nconst x = ({});\n</script>\n`, '/pkg/thing/Thing.vue'],
    ['a file that is not a component', 'export default ({ name: \'thing\' });', '/pkg/thing/thing.js'],
  ])('should leave %s alone', (_, code, id) => {
    expect(transform(code, id)).toBeUndefined();
  });
});
