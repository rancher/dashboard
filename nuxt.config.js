import fs from 'fs';
import path from 'path';
import { STANDARD } from './config/private-label';
import { directiveSsr as t } from './plugins/i18n';
import { trimWhitespaceSsr as trimWhitespace } from './plugins/trim-whitespace';

require('dotenv').config();

const version = process.env.VERSION ||
  process.env.DRONE_TAG ||
  process.env.DRONE_VERSION ||
  require('./package.json').version;

const dev = (process.env.NODE_ENV !== 'production');
const pl = process.env.PL || STANDARD;
const commit = process.env.COMMIT || 'head';

let api = process.env.API || 'http://localhost:8989';

if ( !api.startsWith('http') ) {
  api = `https://${ api }`;
}

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

console.log(`Build: ${ dev ? 'Development' : 'Production' }`); // eslint-disable-line no-console

if ( !dev ) {
  console.log(`Version: ${ version } (${ commit })`); // eslint-disable-line no-console
}

if ( resourceBase ) {
  console.log(`Resource Base URL: ${ resourceBase }`); // eslint-disable-line no-console
}

if ( routerBasePath !== '/' ) {
  console.log(`Router Base Path: ${ routerBasePath }`); // eslint-disable-line no-console
}

if ( pl !== STANDARD ) {
  console.log(`PL: ${ pl }`); // eslint-disable-line no-console
}

console.log(`API: ${ api }`); // eslint-disable-line no-console

module.exports = {
  dev,

  // Configuration visible to the client, https://nuxtjs.org/api/configuration-env
  env: {
    commit,
    version,
    dev,
    pl,
  },

  buildDir: dev ? '.nuxt' : '.nuxt-prod',

  buildModules: [
    '@nuxtjs/style-resources',
  ],
  styleResources: {
    // only import functions, mixins, or variables, NEVER import full styles https://github.com/nuxt-community/style-resources-module#warning
    scss: [
      '~assets/styles/base/_variables.scss',
      '~assets/styles/base/_functions.scss',
      '~assets/styles/base/_mixins.scss',
    ],
  },

  // mode:    'spa', --- Use --spa CLI flag, or ?spa query param.

  loading: '~/components/nav/GlobalLoading.vue',

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
    parallel:   true,
    cache:      true,
    hardSource: true,

    uglify: {
      uglifyOptions: { compress: !dev },
      cache:         './node_modules/.cache/uglify'
    },

    'html.minify': {
      collapseBooleanAttributes:  !dev,
      decodeEntities:             !dev,
      minifyCSS:                  !dev,
      minifyJS:                   !dev,
      processConditionalComments: !dev,
      removeEmptyAttributes:      !dev,
      removeRedundantAttributes:  !dev,
      trimCustomFragments:        !dev,
      useShortDoctype:            !dev
    },

    filenames: { chunk: ({ isDev }) => isDev ? '[name].js' : '[name].[contenthash].js' },
    // @TODO figure out how to split chunks up better, by product
    // optimization: {
    //   splitChunks: {
    //     cacheGroups: {
    //       styles: {
    //         name:    'styles',
    //         test:    /\.(css|vue)$/,
    //         chunks:  'all',
    //         enforce: true
    //       },
    //     }
    //   }
    // },

    extend(config, { isClient, isDev }) {
      if ( isDev ) {
        config.devtool = 'eval-source-map';
      } else {
        config.devtool = 'source-map';
      }

      if ( resourceBase ) {
        config.output.publicPath = resourceBase;
      }

      // Remove default image handling rules
      for ( let i = config.module.rules.length - 1 ; i >= 0 ; i-- ) {
        if ( /svg/.test(config.module.rules[i].test) ) {
          config.module.rules.splice(i, 1);
        }
      }

      // And substitue our own
      config.module.rules.unshift({
        test:    /\.(png|jpe?g|gif|svg|webp)$/,
        use:  [
          {
            loader:  'url-loader',
            options: {
              name:     '[path][name].[ext]',
              limit:    1,
              esModule: false
            },
          }
        ]
      });

      config.module.rules.unshift({
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

    // extractCSS:   true,
    cssSourceMap: true,
    babel:        {
      presets({ isServer }) {
        return [
          [
            require.resolve('@nuxt/babel-preset-app'),
            {
              // buildTarget: isServer ? 'server' : 'client',
              corejs:      { version: 3 },
              targets:     isServer ? { node: 'current' } : { browsers: ['last 2 versions'] },
              modern:      !isServer
            }
          ]
        ];
      },
      plugins: ['@babel/plugin-transform-modules-commonjs'],
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

  // modern: true, -- now part of preset above

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
    '@nuxtjs/webpack-profile',
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
    '/api':       proxyWsOpts(api), // Management k8s API
    '/apis':      proxyWsOpts(api), // Management k8s API
    '/v1':        proxyWsOpts(api), // Management Steve API
    '/v3':        proxyWsOpts(api), // Rancher API
    '/v3-public': proxyOpts(api), // Rancher Unauthed API
    '/api-ui':    proxyOpts(api), // Browser API UI
    '/meta':      proxyOpts(api), // Browser API UI
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
  eslint: { cache: './node_modules/.cache/eslint' },
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
  proxyReq.setHeader('x-forwarded-proto', 'https');
  // console.log(proxyReq.getHeaders());
}

function onProxyReqWs(proxyReq, req, socket, options, head) {
  req.headers.origin = options.target.href;
  proxyReq.setHeader('origin', options.target.href);
  proxyReq.setHeader('x-api-host', req.headers['host']);
  proxyReq.setHeader('x-forwarded-proto', 'https');
  // console.log(proxyReq.getHeaders());

  socket.on('error', (err) => {
    console.error('Proxy WS Error:', err); // eslint-disable-line no-console
  });
}

function onError(err, req, res) {
  res.statusCode = 500;
  console.error('Proxy Error:', err); // eslint-disable-line no-console
  res.write(JSON.stringify(err));
}
