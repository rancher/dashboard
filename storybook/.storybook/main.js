import { dirname, join } from "path";
const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const NM_REGEX  = /node_modules\/(.*)/

module.exports = {
  framework: {
    name: '@storybook/vue3-webpack5',
    options: {}
  },
  
  stories: [
    '../stories/**/Welcome.mdx',
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)'
  ],

  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("storybook-dark-mode"),
    getAbsolutePath("@storybook/addon-actions"),
    getAbsolutePath("@storybook/addon-mdx-gfm"),
    '@storybook/addon-webpack5-compiler-babel'
  ],

  features: {
    buildStoriesJson: true, // 👈 Enable this to build the stories.json file
  },

  core: {
    disableTelemetry: true,
  },

  staticDirs: [
    'public',
    '../../shell/assets'
  ],

  webpackFinal: async (config, { configType }) => {
    const baseFolder = path.resolve(__dirname, '..', '..');

    const sassLoader = {
      loader: 'sass-loader',
      options: {
        additionalData: `@use "sass:math"; @import '~shell/assets/styles/app.scss'; @import '~storybook/stories/global.scss'; `,
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
              const file = path.resolve(baseFolder, url.substr(2));

              return done({ file });
            }

            done(null);
          }
        }
      },
    }

    // Replace js-modal and xterm imports with absolute paths
    const nmrp = new webpack.NormalModuleReplacementPlugin(/js-modal|xterm|diff2html/, function(resource) {
      const split = resource.request.split('!');
      const p = split.pop();
      const match = p.match(NM_REGEX);
      if (match) {
        split.push(path.join(baseFolder, match[0]));
      } else {
        split.push(p);
      }

      resource.request = split.join('!');
    });

    config.plugins.unshift(nmrp);

    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', sassLoader],
      include: baseFolder,
    });

    config.module.rules.unshift({
      test:    /\.ya?ml$/i,
      loader:  'js-yaml-loader',
      options: { name: '[path][name].[ext]' },
    });

    // Root path
    config.resolve.alias['~'] = baseFolder;
    config.resolve.alias['@'] = baseFolder;
    config.resolve.alias['@shell'] = path.join(baseFolder, 'shell');
    config.resolve.alias['@components'] = path.join(baseFolder, 'pkg', 'rancher-components', 'src', 'components');
    config.resolve.alias['~shell'] = path.join(baseFolder, 'shell');

    // Cheat for importing ~shell/assets
    config.resolve.modules.push(baseFolder);

    // Do not cache babel results - this causes issues with Typescript transpiling for rancher components
    config.module.rules.forEach(r => {
      (r.use || []).forEach(r => {
        if (r.options && r.options.cacheDirectory) {
          r.options.cacheDirectory = false;
        }
      });
    });

    return config;
  },

  docs: {
    autodocs: true
  }
}

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
