const { CreateVolumePermissionModifications, Phase1DHGroupNumbersListValue } = require('@aws-sdk/client-ec2');
const path = require('path');

module.exports = {
  "stories": [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-a11y"
  ],

  webpackFinal: async (config, { configType }) => {
    const baseFolder = path.resolve(__dirname, '..');
    const assets = path.resolve(__dirname, '..', 'assets');

    const sassLoader = {
      loader: 'sass-loader',
      options: {
        // prependData: `@import '${assets}/styles/app.scss'; @import '$a`,
        prependData: `@import '~assets/styles/app.scss'; @import '~stories/global.scss'; `,
        sassOptions: {
          // importer: (url, resourcePath) => {
          //   console.log('>>>>>> ' + url);
          //   return null;
          // }
        }
      },
    }

    // Make whatever fine-grained changes you need
    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', sassLoader],
      include: path.resolve(__dirname, '../'),
    });

    // Root path
    config.resolve.alias['~'] = path.dirname(path.resolve(__dirname));
    config.resolve.alias['@'] = path.dirname(path.resolve(__dirname));

    // Cheat for importing ~assets
    config.resolve.modules.push(baseFolder);

    // console.log(config);

    // config.resolve.roots = [path.dirname(path.resolve(__dirname))];

    // TODO: To fix xterm and a couple of others
    // config.resolve.plugins.push({
    //   apply: (config, resolver) => {
    //     config.plugin('module', function (init, callback) {
    //       console.log(init);

    //       return resolver.doResolve()
    //       callback(null);
    //     });
    //   }
    // });

    // Return the altered config
    return config;
  },  
}