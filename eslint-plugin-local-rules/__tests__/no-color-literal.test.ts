const { deserialize, serialize } = require('v8');

global.structuredClone ||= (value) => deserialize(serialize(value));

const { RuleTester } = require('eslint');
const vueParser = require('vue-eslint-parser');
const rule = require('../no-color-literal');

const ruleTester = new RuleTester({
  languageOptions: {
    parser:        vueParser,
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  },
});

const vue = (template: string, script = 'export default {};') => ({
  filename: 'Component.vue',
  code:     `<script>\n${ script }\n</script>\n<template>\n  ${ template }\n</template>\n`,
});

const hardCoded = (color: string, fix: string) => ({ message: new RegExp(`^Hard-coded color "${ color }": ${ fix }`) });
const unused = { message: /^Unused rule-to-test\/no-color-literal disable/ };

ruleTester.run('no-color-literal', rule, {
  valid: [
    { code: "const status = 'red';" },
    { code: "const style = { color: 'var(--color-red-405)' };" },
    { code: "const style = { fill: 'currentColor' };" },
    { code: "const label = 'Status: red';" },
    vue('<path fill="var(--color-white)" />'),
    vue('<BadgeState color="bg-success" />'),
    vue('<div :class="ok ? \'green\' : \'red\'" />'),
    { code: "// eslint-disable-next-line rule-to-test/no-color-literal\nconst color = '#fff';" },
  ],
  invalid: [
    { code: "const color = '#fff';", errors: [hardCoded('#fff', 'use var\\(--color-white\\)')] },
    { code: "const style = { color: 'red' };", errors: [hardCoded('red', 'use var\\(--color-red-372\\)')] },
    { code: "const style = { backgroundColor: 'SaddleBrown' };", errors: [hardCoded('SaddleBrown', 'use var\\(--color-orange-529\\)')] },
    { code: "const style = { 'border-color': 'white' };", errors: [hardCoded('white', 'use var\\(--color-white\\)')] },
    { code: "const css = 'border: 1px solid red';", errors: [hardCoded('red', 'use var\\(--color-red-372\\)')] },
    { ...vue('<path fill="white" />'), errors: [hardCoded('white', 'use var\\(--color-white\\)')] },
    { ...vue('<stop stop-color="black" />'), errors: [hardCoded('black', 'use var\\(--color-black\\)')] },
    { ...vue('<div :style="{ color: \'red\' }" />'), errors: [hardCoded('red', 'use var\\(--color-red-372\\)')] },
    { ...vue('<!-- eslint-disable-next-line rule-to-test/no-color-literal -->\n  <path fill="#fff" />'), errors: [hardCoded('#fff', 'use var\\(--color-white\\)')] },
    { code: "// eslint-disable-next-line rule-to-test/no-color-literal\nconst color = 'var(--color-white)';", errors: [unused] },
    { code: '// eslint-disable-next-line rule-to-test/no-color-literal -- kept for extensions\nconst ok = 1;', errors: [unused] },
    { ...vue('<!-- eslint-disable-next-line rule-to-test/no-color-literal -->\n  <path fill="var(--color-white)" />'), errors: [unused] },
  ],
});
