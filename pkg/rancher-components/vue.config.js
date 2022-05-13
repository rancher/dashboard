// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')

module.exports = {
  chainWebpack: (config) => {
    config.resolve.alias.set(
      '@',
      path.resolve(__dirname, '../../shell/')
    )
    config.resolve.alias.set(
      '@shell',
      path.resolve(__dirname, '../../shell/')
    )
    config.resolve.alias.set(
      '~',
      path.resolve(__dirname, 'src')
    )
  },
  css: {
    extract: false,
    loaderOptions: {
      sass: {
        prependData: `
          @import "../../shell/assets/styles/base/_mixins.scss";
          @import "../../shell/assets/styles/base/_variables.scss";
        `
      }
    }
  }
}
