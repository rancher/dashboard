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
          @import "./src/assets/styles/_mixins.scss"; 
          @import "./src/assets/styles/_variables.scss";
        `
      }
    }
  }
}
