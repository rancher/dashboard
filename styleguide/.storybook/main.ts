import type { StorybookConfig } from "@storybook/vue3-webpack5";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import fs from "fs";
import path, { join, dirname } from "path";
import webpack from "webpack";

const baseFolder = path.resolve(__dirname, '..', '..');

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

const getSassLoader = () => ({
    loader: 'sass-loader',
    options: {
      additionalData: `@use "sass:math"; @import '~shell/assets/styles/app.scss';`,
      sassOptions: {
        importer: (url, prev, done) => {
          if (url.indexOf('~/') === 0) {
            const file = path.resolve(baseFolder, url.substr(2));
            return fs.exists(file, (ok) => {
              if (ok) {
                return done({ file });
              }
              return done(null);
            });
          } else if (url.indexOf('@/node_modules') === 0) {
            return done({ file: path.resolve(baseFolder, url.substr(2)) });
          }

          done(null);
        }
      }
    },
});

/**
 * Replace js-modal and xterm imports with absolute paths
 * @param resource 
 */
const replaceModulePath = (resource) => {
  const modulePathSplit = resource.request.split('!');
  const modulePath = modulePathSplit.pop();
  if (modulePath) {
    const match = modulePath.match(/node_modules\/(.*)/);
    if (match) {
      modulePathSplit.push(path.join(baseFolder, match[0]));
    } else {
      modulePathSplit.push(modulePath);
    }

    resource.request = modulePathSplit.join('!');
  }
}

/**
 * Add aliases 
 * https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules#builder-aliases
 * @param config 
 */
const setAliases = (config: webpack.Configuration) => {
  if (config.resolve) {
    config.resolve.alias = {
      ...config.resolve?.alias,
      '~': baseFolder,
      '@': baseFolder,
      '@shell': path.join(baseFolder, 'shell'),
      '@components': path.join(baseFolder, 'pkg', 'rancher-components', 'src', 'components'),
      '~shell': path.join(baseFolder, 'shell'),
    };
  };

  return config;
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
  webpackFinal: async (config) => {
    config = setAliases(config);
    config.module?.rules?.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', getSassLoader()],
      include: baseFolder,
    });

    if (config.plugins) {
      // BREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default.
      config.plugins.push(new NodePolyfillPlugin() as any);
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(/js-modal|xterm|diff2html/, replaceModulePath));
    }
 
    return config
  },
};
export default config;
