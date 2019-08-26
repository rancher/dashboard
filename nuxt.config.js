import fs from 'fs';
import path from 'path';

require('dotenv').config();

console.log(`Proxying to ${ process.env.API }`);

module.exports = {

  // mode: 'universal',
  loading: '~/components/loading.vue',

  // Axios: https://axios.nuxtjs.org/options
  axios: {
    https:          true,
    proxy:          true,
    retry:          { retries: 0 },
    // debug:   true
  },

  build: {
    extend(config, { isDev, isClient }) {
      if (isDev) {
        config.devtool = isClient ? '#source-map' : 'inline-source-map';
      }
    },
    //    extractCSS: true,
    //    cssSourceMap: true
  },

  // Global CSS
  css: [
    '@/assets/styles/app.scss'
  ],

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

  // Nuxt modules
  modules: [
    '@nuxtjs/proxy',
    '@nuxtjs/axios',
    '@nuxtjs/eslint-module',
    'cookie-universal-nuxt',
    'portal-vue/nuxt',
    '~/modules/norman-rehydrate',
  ],

  // Vue plugins
  plugins: [
    // Third-party
    '~/plugins/axios',
    '~/plugins/dropdown-menu',
    '~/plugins/tooltip',
    '~/plugins/v-select',
    '~/plugins/transitions',
    { src: '~/plugins/js-yaml', ssr: false },
    { src: '~/plugins/codemirror', ssr: false },
    { src: '~/plugins/resize', ssr: false },

    // First-party
    '~/plugins/global-formatters',
    '~/plugins/trim-whitespace',
    { src: '~/plugins/apply-query' },
    { src: '~/plugins/lookup', ssr: false },
    { src: '~/plugins/nuxt-client-init', ssr: false },
    { src: '~/plugins/websocket', ssr: false },
  ],

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

        socket.on('error', (err) => {
          console.error('Proxy WS Error:', err);
        });
      },
      onError(err, req, res) {
        res.statusCode = 500;
        console.error('Proxy Error:', err);
        res.write(JSON.stringify(err));
      }
    },
    '/api':    { target: process.env.API, xfwd: true },
    '/api-ui': { target: process.env.API, xfwd: true }
  },

  // Vue router
  router: {
    // Generate routes with slashes
    routeNameSplitter: '/',
  },

  // Nuxt server
  server: {
    https: {
      key:  fs.readFileSync(path.resolve(__dirname, 'server/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'server/server.crt'))
    },
    port:      8005,
    host:      '0.0.0.0',
  },

  // Server middleware
  serverMiddleware: [
    '~/server/no-ssr'
  ],
};
