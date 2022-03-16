module.exports = {
  css: {
    extract: false,
    loaderOptions: {
      sass: {
        prependData: `
          @import "/assets/styles/_mixins.scss"; 
          @import "/assets/styles/_variables.scss";
        `
      }
    }
  }
}
