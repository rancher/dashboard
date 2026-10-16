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
  let root: string;

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'color-usage-'));
    write(root, EDITOR, `
<script>
import { COLOR_TOKENS } from '@components/design-system/colors';

export const accent = COLOR_TOKENS['--color-red-405'];
</script>

<template>
  <div :style="{ color: 'var(--color-blue-552)' }" />
</template>

<style lang="scss" scoped>
$editor-accent: $color-orange-243;

.editor {
  --bg: var(--color-white);
  border: 1px solid var(--color-gray-96);
}

.editor:is(.theme-dark *) {
  --bg: var(--color-gray-777);
}

.theme-light .banner {
  color: var(--color-green-187);
}
</style>
`);
    write(root, MODERN, `
$primary: $color-blue-451;

body, .theme-light {
  --primary: #{$primary};

  .text-primary {
    color: var(--color-blue-349);
  }
}
`);
    write(root, 'shell/components/__tests__/Editor.test.ts', `const color = 'var(--color-pink-389)';`);
    write(root, 'pkg/rancher-components/src/components/design-system/colors.scss', ':root { --color-white: #{$color-white}; }');
  });

  afterAll(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it.each([
    ['a script reference to both themes', '--color-red-405', EDITOR, true, true],
    ['a template reference to both themes', '--color-blue-552', EDITOR, true, true],
    ['an unscoped style to both themes', '--color-gray-96', EDITOR, true, true],
    ['a style the dark theme overrides to the light theme', '--color-white', EDITOR, true, false],
    ['a style scoped to the dark theme to the dark theme', '--color-gray-777', EDITOR, false, true],
    ['a style scoped to the light theme to the light theme', '--color-green-187', EDITOR, true, false],
    ['a rule under a body selector to both themes', '--color-blue-349', MODERN, true, true],
    ['a theme variable to no theme, which the page resolves', '--color-blue-451', MODERN, false, false],
    ['a component Sass variable to no theme', '--color-orange-243', EDITOR, false, false],
  ])('counts %s', (_, name, file, light, dark) => {
    expect(colorUsage(root)[name]).toStrictEqual({
      uses: 1, files: { [file]: 1 }, light, dark
    });
  });

  it('skips tests and the design system itself', () => {
    expect(Object.keys(colorUsage(root)).sort()).toStrictEqual([
      '--color-blue-349', '--color-blue-451', '--color-blue-552', '--color-gray-777', '--color-gray-96', '--color-green-187', '--color-orange-243', '--color-red-405', '--color-white'
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
