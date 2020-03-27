import fs from 'fs';
import path from 'path';
import { trimWhitespaceSsr as trimWhitespace } from './plugins/trim-whitespace';
import { directiveSsr as t } from './plugins/i18n';
import { STANDARD } from './config/private-label';

require('dotenv').config();

const version = process.env.VERSION ||
  process.env.DRONE_TAG ||
  process.env.DRONE_VERSION ||
  require('./package.json').version;

const dev = (process.env.NODE_ENV !== 'production');
const api = process.env.API || 'http://localhost:8989';
const pl = process.env.PL || STANDARD;
const commit = process.env.COMMIT || 'head';
const commitDate = process.env.COMMIT_DATE || '';
const commitBranch = process.env.COMMIT_BRANCH || '';

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

console.log(`Build: ${ dev ? 'Development' : 'Production' }`);

if ( resourceBase ) {
  console.log(`Resource Base URL: ${ resourceBase }`);
}

if ( routerBasePath !== '/' ) {
  console.log(`Router Base Path: ${ routerBasePath }`);
}

if ( pl !== STANDARD ) {
  console.log(`PL: ${ pl }`);
}

console.log(`API: ${ api }`);

module.exports = {
  dev,

  // Configuration visible to the client, https://nuxtjs.org/api/configuration-env
  env: {
    commit,
    commitDate,
    commitBranch,
    version,
    dev,
    pl,
  },

  buildDir: dev ? '.nuxt' : '.nuxt-prod',

  // mode:    'spa', --- Use --spa CLI flag, or ?spa query param.

  loading: '~/components/Loading.vue',

  // Axios: https://axios.nuxtjs.org/options
  axios: {
    https:          true,
    proxy:          true,
    retry:          { retries: 0 },
    // debug:   true
  },

  router: {
    base:       routerBasePath,
    middleware: ['i18n'],
  },

  build: {
    publicPath: resourceBase,
    extend(config, { isClient, isDev }) {
      config.devtool = isClient ? 'source-map' : 'inline-source-map';

      if ( resourceBase ) {
        config.output.publicPath = resourceBase;
      }

      config.module.rules.push({
        test:    /\.ya?ml$/i,
        loader:  'js-yaml-loader',
        options: { name: '[path][name].[ext]' },
      });

      // Run ESLint on save
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test:    /\.(js|vue)$/,
          loader:  'eslint-loader',
          exclude: /(node_modules)/
        });
      }
    },
    //    extractCSS: true,
    cssSourceMap: true,
    babel:        {
      presets({ isServer }) {
        return [
          [
            require.resolve('@nuxt/babel-preset-app'),
            {
              buildTarget: isServer ? 'server' : 'client',
              corejs:      { version: 3 }
            }
          ]
        ];
      }
    }
  },

  render: {
    bundleRenderer: {
      directives: {
        trimWhitespace,
        t,
      }
    }
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
      rel:  'icon',
      type: 'image/x-icon',
      href: `${ resourceBase || '/' }favicon.png`
    }]
  },

  // Nuxt modules
  modules: [
    '@nuxtjs/proxy',
    '@nuxtjs/axios',
    '@nuxtjs/eslint-module',
    'cookie-universal-nuxt',
    'portal-vue/nuxt',
    '~/plugins/steve/rehydrate-all',
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
    { src: '~/plugins/shortkey', ssr: false },

    // First-party
    '~/plugins/i18n',
    '~/plugins/global-formatters',
    '~/plugins/trim-whitespace',
    { src: '~/plugins/extend-router' },
    { src: '~/plugins/lookup', ssr: false },
    { src: '~/plugins/nuxt-client-init', ssr: false },
  ],

  // Proxy: https://github.com/nuxt-community/proxy-module#options
  proxy: {
    '/k8s':       proxyWsOpts(api), // Straight to a remote cluster (/k8s/clusters/<id>/)
    '/api':       proxyWsOpts(api), // Managment k8s API
    '/apis':      proxyWsOpts(api), // Managment k8s API
    '/v1':        proxyWsOpts(api), // Management Steve API
    '/v3':        proxyWsOpts(api), // Rancher API
    '/v3-public': proxyOpts(api), // Rancher Unauthed API
    '/api-ui':    proxyOpts(api), // Browser API UI
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

  // Eslint module options
  eslint: { cache: '.eslintcache' },
};

function proxyOpts(target) {
  return {
    target,
    secure: !dev,
    onProxyReq,
    onProxyReqWs,
    onError
  };
}

function proxyWsOpts(target) {
  return {
    ...proxyOpts(target),
    ws:           true,
    changeOrigin: true,
  };
}

function onProxyReq(proxyReq, req) {
  proxyReq.setHeader('x-api-host', req.headers['host']);
  // console.log(proxyReq.getHeaders());
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
