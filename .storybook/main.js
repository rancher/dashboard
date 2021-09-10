const path = require('path');

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