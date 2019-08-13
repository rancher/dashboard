import fs from 'fs';
import path from 'path';

require('dotenv').config();

console.log(`Proxying to ${ process.env.API }`);

module.exports = {

  // mode: 'universal',

  server: {
    https: {
      key:  fs.readFileSync(path.resolve(__dirname, 'server/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'server/server.crt'))
    },
    port:      8005,
    host:      '0.0.0.0',
    /*
    api:       process.env.API,
    apiToken:  process.env.API_TOKEN,
    proxy:     {
      'API UI': '/api-ui',
      API:      '/k8s',
      Naok:     '/v1',
    }
    */
  },

  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, { isDev, isClient }) {
      if (isDev) {
        config.devtool = isClient ? 'eval-source-map' : 'inline-source-map';
      }
    },
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
    // Third-party
    '~/plugins/axios',
    '~/plugins/v-tooltip',

    // First-party
    '~/plugins/global-formatters',
    { src: '~/plugins/lookup', ssr: false },
    { src: '~/plugins/nuxt-client-init', ssr: false },
    { src: '~/plugins/websocket', ssr: false }
  ],

  // Nuxt modules
  modules: [
    '@nuxtjs/proxy',
    '@nuxtjs/axios',
    '@nuxtjs/eslint-module',
    'cookie-universal-nuxt',
    'portal-vue/nuxt'
  ],

  // Server middleware
  serverMiddleware: [
    '~/server/no-ssr'
  ],

  loading: '~/components/loading.vue',

  // Axios: https://axios.nuxtjs.org/options
  axios: {
    https:   true,
    proxy:   true,
    retry:   { retries: 0 },
    // debug:   true
  },

  // Proxy: https://github.com/nuxt-community/proxy-module#options
  proxy: {
    '/v1':     {
      target:       process.env.API,
      xfwd:         true,
      ws:           true,
      logLevel:     'debug',
      changeOrigin: true,
      onProxyReqWs(proxyReq, req, socket, options, head) {
        req.headers.origin = options.target.href;
        proxyReq.setHeader('origin', options.target.href);
      },
      onError(err, req, res) {
        res.statusCode = 500;
        console.log('Proxy Error:', err);
        res.write(err);
      }
    },
    '/api':    { target: process.env.API, xfwd: true },
    '/api-ui': { target: process.env.API, xfwd: true }
  }
};
