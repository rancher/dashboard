import fs from 'fs';
import os from 'os';
import path from 'path';
import { colorUsage, unpaintedVariables } from '../color-usage';

const EDITOR = 'shell/components/Editor.vue';
const MODERN = 'shell/assets/styles/themes/_modern.scss';

const write = (root: string, file: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), content);
};

describe('colorUsage', () => {
  const TEST_FILE = 'shell/components/__tests__/Editor.test.ts';
  const editor = `
<script>
export const accent = '#ee0000';
</script>

<template>
  <path fill="#0000aa" />
</template>

<style lang="scss" scoped>
$editor-accent: #ffaa00;

.editor {
  --bg: white;
  border: 1px solid #dcdee7;
}

.editor:is(.theme-dark *) {
  --bg: #222222;
}

.theme-light .banner {
  color: #aaff00;
}
</style>
`;
  const modern = `
$primary: #2453ff;

body, .theme-light {
  --muted: #b0b0b0;
  --disabled-bg: darken($disabled, 10%);

  .text-primary {
    color: #3d98d3;
  }

  .orphan {
    color: #123457;
  }
}
`;
  const lineOf = (content: string, text: string) => content.split('\n').findIndex((line) => line.includes(text)) + 1;
  let root: string;

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'color-usage-'));
    write(root, EDITOR, editor);
    write(root, MODERN, modern);
    write(root, TEST_FILE, `const color = '#ff00aa';`);
    write(root, 'pkg/rancher-components/src/components/design-system/_color-variables.scss', [
      '$color-white: #ffffff;', '$color-red-405: #ee0000;', '$color-blue-552: #0000aa;', '$color-orange-243: #ffaa00;', '$color-gray-96: #dcdee7;',
      '$color-gray-777: #222222;', '$color-green-187: #aaff00;', '$color-blue-349: #3d98d3;', '$color-blue-451: #2453ff;', '$color-gray-300: #b0b0b0;',
      '$color-blue-182: #b6bbc7;', '$color-pink-389: #ff00aa;',
    ].join('\n'));
    write(root, 'storybook/src/stories/foundation/color-primitives-computed.json', JSON.stringify({
      primitives: {
        '--color-blue-182': [{
          expression: 'darken($disabled, 10%)', inputs: { $disabled: '--color-gray-96' }, file: MODERN
        }]
      }
    }));
    write(root, 'scripts/color-lint-baseline.txt', [
      '# Total colors: 13',
      ...['#ee0000', '#0000aa', '#ffaa00', 'white', '#dcdee7', '#222222', '#aaff00'].map((color) => `${ EDITOR }:${ lineOf(editor, color) }: ${ color }`),
      ...['#2453ff', '#b0b0b0', 'darken($disabled, 10%)', '#3d98d3', '#123457'].map((color) => `${ MODERN }:${ lineOf(modern, color) }: ${ color }`),
      `${ TEST_FILE }:1: #ff00aa`,
    ].join('\n'));
  });

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it.each([
    ['a script color to both themes', '--color-red-405', EDITOR, true, true],
    ['a template color to both themes', '--color-blue-552', EDITOR, true, true],
    ['an unscoped style to both themes', '--color-gray-96', EDITOR, true, true],
    ['a named color the dark theme overrides to the light theme', '--color-white', EDITOR, true, false],
    ['a style scoped to the dark theme to the dark theme', '--color-gray-777', EDITOR, false, true],
    ['a style scoped to the light theme to the light theme', '--color-green-187', EDITOR, true, false],
    ['a rule under a body selector to both themes', '--color-blue-349', MODERN, true, true],
    ['a theme variable to no theme, which the page resolves', '--color-gray-300', MODERN, false, false],
    ['a Sass variable to no theme', '--color-blue-451', MODERN, false, false],
    ['a component Sass variable to no theme', '--color-orange-243', EDITOR, false, false],
    ['a computed color to the primitive the page records it computing', '--color-blue-182', MODERN, false, false],
  ])('counts %s', (_, name, file, light, dark) => {
    expect(colorUsage(root)[name]).toStrictEqual({
      uses: 1, files: { [file]: 1 }, light, dark
    });
  });

  it('skips tests and colors with no primitive', () => {
    expect(Object.keys(colorUsage(root)).sort()).toStrictEqual([
      '--color-blue-182', '--color-blue-349', '--color-blue-451', '--color-blue-552', '--color-gray-300', '--color-gray-777', '--color-gray-96',
      '--color-green-187', '--color-orange-243', '--color-red-405', '--color-white'
    ]);
  });
});

describe('unpaintedVariables', () => {
  let root: string;

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'unpainted-variables-'));
    write(root, MODERN, `
body, .theme-light {
  --painted: var(--color-white);
  --fed: var(--color-gray-96);
  --from-painted: var(--fed);
  --orphan: var(--color-red-405);
  --from-orphan: var(--orphan);
  --read-by-script: var(--color-blue-349);
  --gauge-3: var(--color-green-187);
}
`);
    write(root, EDITOR, `
<script>
const status = { primary: '--read-by-script' };
const gauge = (n) => \`var(--gauge-\${ n })\`;
</script>

<style lang="scss" scoped>
.editor {
  color: var(--painted);
  border-color: var(--from-painted);
}
</style>
`);
  });

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('lists the variables nothing reads, directly or through a painted variable', () => {
    expect(unpaintedVariables(root)).toStrictEqual(['--from-orphan', '--orphan']);
  });
});
