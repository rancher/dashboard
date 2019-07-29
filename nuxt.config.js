const fs = require('fs');
const path = require('path');

module.exports = {
  mode: 'universal',

  server: {
    https: {
      key:  fs.readFileSync(path.resolve(__dirname, 'server/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'server/server.crt'))
    },
    port:      8005,
    host:      '0.0.0.0',
    api:       process.env.API,
    apiToken:  process.env.API_TOKEN,
    apiPrefix: process.env.API_PREFIX,
    proxy:     {
      'API UI': '/api-ui',
      API:      '/k8s',
      Rancher:  '/v3',
    }
  },

  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, { isClient }) {
      if (isClient) {
        config.devtool = '#source-map';
      }
    }

    //    extractCSS: true,
    //    cssSourceMap: true
  },

  head: {
    title: process.env.npm_package_name || '',
    meta:  [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid:     'description',
        name:    'description',
        content: process.env.npm_package_description || ''
      }
    ],
    link: [{
      rel:  'icon', type: 'image/x-icon', href: '/favicon.ico'
    }]
  },

  // Global CSS
  css: [
    '@/assets/styles/app.scss'
  ],

  // Plugins to load before mounting the App
  plugins: [
    '~/plugins/axios.js'
  ],

  // Nuxt modules
  modules: [
    '@nuxtjs/axios',
    '@nuxtjs/eslint-module',
    'cookie-universal-nuxt'
  ],

  router: {
    middleware: [
      'cookies',
      'k8s',
    ],
  },

  loading: '~/components/loading.vue',

  // Axios: https://axios.nuxtjs.org/options
  axios: {
    https: true,
    retry: { retries: 0 },
  }
};
