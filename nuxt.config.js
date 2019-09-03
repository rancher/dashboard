import fs from 'fs';
import path from 'path';

require('dotenv').config();

const dev = (process.env.NODE_ENV !== 'production');
const target = process.env.API || 'http://localhost:8989';

console.log((dev ? 'Development mode' : 'Production mode'));
console.log(`Proxying to ${ target }`);

module.exports = {
  dev,

  // mode: 'universal',
  loading: '~/components/Loading.vue',

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
      target,
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
    '/api':    { target, xfwd: true },
    '/api-ui': { target, xfwd: true }
  },

  // Nuxt server
  server: {
    https: (dev ? {
      key:  fs.readFileSync(path.resolve(__dirname, 'server/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'server/server.crt'))
    } : null),
    port:      (dev ? 8005 : 80),
    host:      '0.0.0.0',
  },

  // Server middleware
  serverMiddleware: [
    '~/server/no-ssr'
  ],
};
