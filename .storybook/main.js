const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const NM_REGEX  = /node_modules\/(.*)/

module.exports = {
  "stories": [
    "../stories/**/Welcome.stories.mdx",
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "storybook-dark-mode"
  ],

  webpackFinal: async (config, { configType }) => {
    const baseFolder = path.resolve(__dirname, '..');

    const sassLoader = {
      loader: 'sass-loader',
      options: {
        prependData: `@use "sass:math"; @import '~shell/assets/styles/app.scss'; @import '~stories/global.scss'; `,
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

    // Cheat for importing ~shell/assets
    config.resolve.modules.push(baseFolder);

    return config;
  },  
}