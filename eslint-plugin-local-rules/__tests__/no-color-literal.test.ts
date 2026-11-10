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

const newColor = 'If you decide to add a new color, check with UX before adding it and giving it a name.';
const hardCoded = (color: string) => ({ message: `Hard-coded color "${ color }": use a theme variable, such as var(--primary), instead. ${ newColor }` });
const computed = (color: string) => ({ message: `Computed color "${ color }": use a theme variable instead of computing a color. ${ newColor }` });

ruleTester.run('no-color-literal', rule, {
  valid: [
    { code: "const status = 'red';" },
    { code: "const style = { color: 'var(--error)' };" },
    { code: "const style = { fill: 'currentColor' };" },
    { code: "const label = 'Status: red';" },
    vue('<path fill="var(--body-bg)" />'),
    vue('<BadgeState color="bg-success" />'),
    vue('<div :class="ok ? \'green\' : \'red\'" />'),
    { code: "// eslint-disable-next-line rule-to-test/no-color-literal\nconst color = '#fff';" },
  ],
  invalid: [
    { code: "const color = '#fff';", errors: [hardCoded('#fff')] },
    { code: "const style = { color: 'red' };", errors: [hardCoded('red')] },
    { code: "const style = { backgroundColor: 'SaddleBrown' };", errors: [hardCoded('SaddleBrown')] },
    { code: "const style = { 'border-color': 'white' };", errors: [hardCoded('white')] },
    { code: "const css = 'border: 1px solid red';", errors: [hardCoded('red')] },
    { code: `const bg = \`rgba(var(\${ name }), 0.5)\`;`, errors: [computed('rgba(var(')] },
    { ...vue('<path fill="white" />'), errors: [hardCoded('white')] },
    { ...vue('<stop stop-color="black" />'), errors: [hardCoded('black')] },
    { ...vue('<div :style="{ color: \'red\' }" />'), errors: [hardCoded('red')] },
  ],
});
