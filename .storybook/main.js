const path = require('path');
const fs = require('fs');

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
        prependData: `@import '~assets/styles/app.scss'; @import '~stories/global.scss'; `,
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

    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', sassLoader],
      include: path.resolve(__dirname, '../'),
    });

    config.module.rules.unshift({
      test:    /\.ya?ml$/i,
      loader:  'js-yaml-loader',
      options: { name: '[path][name].[ext]' },
    });

    // Root path
    config.resolve.alias['~'] = baseFolder;
    config.resolve.alias['@'] = baseFolder;

    // Cheat for importing ~assets
    config.resolve.modules.push(baseFolder);

    return config;
  },  
}