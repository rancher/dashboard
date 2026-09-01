// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  chainWebpack: (config) => {
    config.resolve.alias.set(
      '~',
      path.resolve(__dirname, 'src')
    );
    config.resolve.alias.set(
      '@',
      path.resolve(__dirname, '../../shell/')
    );
    config.resolve.alias.set(
      '@shell',
      path.resolve(__dirname, '../../shell/')
    );
    config.resolve.alias.set(
      '@components',
      path.resolve(__dirname, 'src/components')
    );
  },
  css: {
    extract:       false,
    loaderOptions: {
      sass: {
        additionalData: `
          @import "../../shell/assets/styles/base/_mixins.scss";
          @import "../../shell/assets/styles/base/_variables.scss";
        `
      }
    }
  }
};
