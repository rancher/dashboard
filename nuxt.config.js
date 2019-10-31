import fs from 'fs';
import path from 'path';

require('dotenv').config();

const version = process.env.VERSION ||
  process.env.DRONE_TAG ||
  process.env.DRONE_VERSION ||
  require('./package.json').version;

const dev = (process.env.NODE_ENV !== 'production');
const steve = process.env.API || 'http://localhost:8989';
const rancher = process.env.RANCHER || 'https://localhost:30443';

let routerBasePath = '/';
let resourceBase = '';
let outputDir = 'dist';

if ( typeof process.env.ROUTER_BASE !== 'undefined' ) {
  routerBasePath = process.env.ROUTER_BASE;
}

if ( typeof process.env.RESOURCE_BASE !== 'undefined' ) {
  resourceBase = process.env.RESOURCE_BASE;
}

if ( typeof process.env.OUTPUT_DIR !== 'undefined' ) {
  outputDir = process.env.OUTPUT_DIR;
}

if ( resourceBase && !resourceBase.endsWith('/') ) {
  resourceBase += '/';
}

console.log(`Mode: ${ dev ? 'Development' : 'Production' }`);
console.log(`Router Base Path: ${ routerBasePath || '(none)' }`);
console.log(`Resource Base URL: ${ resourceBase || '(none)' }`);
console.log(`Steve: ${ steve }`);
console.log(`Rancher: ${ rancher }`);

if ( dev ) {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
}

module.exports = {
  dev,
  version,

  buildDir: dev ? '.nuxt' : '.nuxt-prod',

  // mode: 'universal',
  loading: '~/components/Loading.vue',

  // Axios: https://axios.nuxtjs.org/options
  axios: {
    https:          true,
    proxy:          true,
    retry:          { retries: 0 },
    // debug:   true
  },

  router: { base: routerBasePath },

  build: {
    publicPath: resourceBase,
    extend(config, { isClient }) {
      config.devtool = isClient ? '#source-map' : 'inline-source-map';

      if ( resourceBase ) {
        config.output.publicPath = resourceBase;
      }
    },
    //    extractCSS: true,
    cssSourceMap: true
  },

  modern: true,

  generate: { dir: outputDir },

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
    '~/plugins/vue-clipboard2',
    '~/plugins/v-select',
    '~/plugins/transitions',
    { src: '~plugins/vue-js-modal' },
    { src: '~/plugins/js-yaml', ssr: false },
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
    '/k8s': {
      target:       steve,
      xfwd:         true,
      ws:           true,
      changeOrigin: true,
      onProxyReq,
      onProxyReqWs,
      onError,
    },
    '/v1': {
      target:       steve,
      xfwd:         true,
      ws:           true,
      changeOrigin: true,
      onProxyReq,
      onProxyReqWs,
      onError,
    },
    '/api/v1': {
      target:       steve,
      xfwd:         true,
      ws:           true,
      changeOrigin: true,
      onProxyReq,
      onProxyReqWs,
      onError,
    },
    '/apis': {
      target:       steve,
      xfwd:         true,
      ws:           true,
      changeOrigin: true,
      onProxyReq,
      onProxyReqWs,
      onError,
    },
    '/v3': {
      target:       rancher,
      xfwd:         true,
      ws:           true,
      changeOrigin: true,
      onProxyReq,
      onProxyReqWs,
      onError,
    },
    '/v3-public': {
      target: rancher,
      xfwd:   true,
      onProxyReq,
      onProxyReqWs,
      onError
    },
    '/api-ui':    {
      target: rancher,
      xfwd:   true,
      onProxyReq,
      onProxyReqWs,
      onError
    }
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

function onProxyReq(proxyReq, req) {
  proxyReq.setHeader('x-api-host', req.headers['host']);
}

function onProxyReqWs(proxyReq, req, socket, options, head) {
  req.headers.origin = options.target.href;
  proxyReq.setHeader('origin', options.target.href);
  proxyReq.setHeader('x-api-host', req.headers['host']);
  // console.log(proxyReq.getHeaders());

  socket.on('error', (err) => {
    console.error('Proxy WS Error:', err);
  });
}

function onError(err, req, res) {
  res.statusCode = 500;
  console.error('Proxy Error:', err);
  res.write(JSON.stringify(err));
}
