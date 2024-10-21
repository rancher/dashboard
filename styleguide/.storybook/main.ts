import type { StorybookConfig } from "@storybook/vue3-webpack5";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import path, { join, dirname } from "path";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
  framework: {
    name: getAbsolutePath('@storybook/vue3-webpack5'),
    options: {}
  },
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    getAbsolutePath("@storybook/addon-onboarding"),
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath('@storybook/addon-webpack5-compiler-babel')
  ],
  core: {
    disableTelemetry: true,
  },
  docs: {
    autodocs: true
  },
  webpackFinal: async (config, { configType }) => {
    if (config.resolve) {
      const baseFolder = path.resolve(__dirname, '..', '..');

      // Add aliases https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules#builder-aliases
      config.resolve.alias = {
        ...config.resolve?.alias,
        '~': baseFolder,
        '@': baseFolder,
        '@shell': path.join(baseFolder, 'shell'),
        '@components': path.join(baseFolder, 'pkg', 'rancher-components', 'src', 'components'),
        '~shell': path.join(baseFolder, 'shell'),
      };

      // BREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default.
      config.plugins?.push(new NodePolyfillPlugin() as any);
    }
 
    return config
  },
};
export default config;
