import type { StorybookConfig } from '@storybook/vue3-vite';
import path, { join, dirname } from 'path';
import remarkGfm from 'remark-gfm';
import { colorUsage, unpaintedVariables } from './color-usage';

const baseFolder = path.resolve(__dirname, '..', '..');
const shellFolder = path.join(baseFolder, 'shell');
const componentsFolder = path.join(baseFolder, 'pkg', 'rancher-components', 'src', 'components');

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}

/**
 * Add aliases
 * https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules#builder-aliases
 */
const aliases = [
  { find: '~shell', replacement: shellFolder },
  { find: '@shell', replacement: shellFolder },
  { find: '~@shell', replacement: shellFolder },
  { find: '@components', replacement: componentsFolder },
  { find: '~@components', replacement: componentsFolder },
  { find: '~@rancher/icons', replacement: path.join(baseFolder, 'node_modules', '@rancher', 'icons') },
  { find: /^(\.\/)?node_modules\//, replacement: `${ path.join(baseFolder, 'node_modules') }/` },
  { find: '~', replacement: baseFolder },
  { find: '@', replacement: baseFolder },
];

const config: StorybookConfig = {
  framework: {
    name:    getAbsolutePath('@storybook/vue3-vite'),
    options: {}
  },
  staticDirs: ['../public', '../../shell/assets'],
  stories:    [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    getAbsolutePath('@storybook/addon-onboarding'),
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions'),
    getAbsolutePath('@storybook/addon-themes'),
    getAbsolutePath('storybook-addon-pseudo-states'),
    // Add support for table generation from markdown using MDX files
    {
      name:    '@storybook/addon-docs',
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
  ],
  core:      { disableTelemetry: true },
  docs:      {},
  viteFinal: async(config) => {
    const { mergeConfig } = await import('vite');
    const { default: vue } = await import('@vitejs/plugin-vue');
    const { rancherLoaders } = await import('../../shell/vite/loaders.mjs');
    const { vueParenthesisedDefaultExport } = await import('../../shell/vite/vue-compat.mjs');

    const plugins = [
      vueParenthesisedDefaultExport(),
      vue(),
      rancherLoaders(),
      ...config.plugins || [],
    ];

    return mergeConfig({ ...config, plugins }, {
      define: {
        __COLOR_USAGE__:         JSON.stringify(colorUsage(baseFolder)),
        __UNPAINTED_VARIABLES__: JSON.stringify(unpaintedVariables(baseFolder)),
      },
      resolve: {
        alias:      aliases,
        dedupe:     ['vue', 'vuex'],
        extensions: ['.mjs', '.js', '.jsx', '.vue', '.json', '.tsx', '.ts', '.scss'],
      },
      css: {
        preprocessorOptions: {
          scss: {
            additionalData:      `@use "sass:math"; @import '~shell/assets/styles/app.scss';`,
            silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
          },
        },
      },
    });
  },
};

export default config;
