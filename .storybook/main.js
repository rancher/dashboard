const path = require('path');

module.exports = {
  stories: ['../stories/**/*.stories.js', '../components/**/*.stories.js'],
  addons: ['@storybook/addon-actions', '@storybook/addon-links', '@storybook/addon-backgrounds/register', '@storybook/addon-docs'],
  presets: ['@storybook/preset-scss'],
  webpackFinal: async (config, { configType }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.

    // Make whatever fine-grained changes you need
    const extraRules = [
      {
        test: /\.s?css$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader'],
        include: path.resolve(__dirname, '../')
      },
      {
        test: /\.(svg|woff|woff2|ttf)$/,
        loader: "file-loader"
      }
    ];

    config.module.rules.push(...extraRules);

    config.resolve.alias['@'] = path.dirname(path.resolve(__dirname));
    config.resolve.alias['~'] = path.dirname(path.resolve(__dirname));

    // Return the altered config
    return config;
  }
};
