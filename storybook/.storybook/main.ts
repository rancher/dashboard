import type { StorybookConfig } from "@storybook/vue3-webpack5";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import fs from "fs";
import path, { join, dirname } from "path";
import webpack from "webpack";
import remarkGfm from 'remark-gfm';
import { get } from "lodash";

const baseFolder = path.resolve(__dirname, '..', '..');

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

const sassLoader = {
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
};

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
 */
const webpackAliases = {
  '~': baseFolder,
  '@': baseFolder,
  '@shell': path.join(baseFolder, 'shell'),
  '@components': path.join(baseFolder, 'pkg', 'rancher-components', 'src', 'components'),
  '~shell': path.join(baseFolder, 'shell'),
};

const webpackLoaders = [
  {
    test: /\.scss$/,
    use: ['style-loader', 'css-loader', sassLoader],
    include: baseFolder,
  },
  // Map YAML to JSON
  {
    test: /\.ya?ml$/i,
    loader: 'js-yaml-loader',
    options: { name: '[path][name].[ext]' },
  }
];

const webpackPlugins = [
  new NodePolyfillPlugin() as any,
    // BREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default.
  new webpack.NormalModuleReplacementPlugin(/js-modal|xterm|diff2html/, replaceModulePath)
]

const config: StorybookConfig = {
  framework: {
    name: getAbsolutePath('@storybook/vue3-webpack5'),
    options: {}
  },
  staticDirs: ['../public', '../../shell/assets'],
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    getAbsolutePath("@storybook/addon-onboarding"),
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath('@storybook/addon-webpack5-compiler-babel'),
    // Add support for table generation from markdown using MDX files
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  core: {
    disableTelemetry: true,
  },
  docs: {},
  // https://storybook.js.org/docs/builders/webpack#import-a-custom-webpack-configuration
  webpackFinal: (config: webpack.Configuration) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        ...webpackAliases,
      }
    },
    module: {
      ...config.module,
      rules: [
        ...config.module?.rules || [],
        ...webpackLoaders,
      ],
    },
    plugins: [
      ...config.plugins || [],
      ...webpackPlugins,
    ]
  }),
};
export default config;
