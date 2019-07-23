module.exports = {
  mode: 'universal',

  server: {
    port: 8005,
    host: '0.0.0.0'
  },

  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {},

    //    extractCSS: true,
    //    cssSourceMap: true
  },

  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || ''
      }
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },

  loading: {
    color: '#fff'
  },

  // Global CSS
  css: [
    '@/assets/styles/app.scss'
  ],

  // Plugins to load before mounting the App
  plugins: [],

  // Nuxt modules
  modules: [
    '@nuxtjs/axios',
    '@nuxtjs/eslint-module',
  ],

  // Axios: https://axios.nuxtjs.org/options
  axios: {},
}
