import fs from 'fs';
import path from 'path';
import serveStatic from 'serve-static';
import webpack from 'webpack';

import { STANDARD } from './config/private-label';
import { generateDynamicTypeImport } from './pkg/auto-import';
import { directiveSsr as t } from './plugins/i18n';
import { trimWhitespaceSsr as trimWhitespace } from './plugins/trim-whitespace';

const createProxyMiddleware = require('http-proxy-middleware');

// Global variables
let api = process.env.API || 'http://localhost:8989';

if ( !api.startsWith('http') ) {
  api = `https://${ api }`;
}

// needed for proxies
export const API_PATH = api;

const dev = (process.env.NODE_ENV !== 'production');
const devPorts = dev || process.env.DEV_PORTS === 'true';
const version = process.env.VERSION ||
  process.env.DRONE_TAG ||
  process.env.DRONE_VERSION ||
  require('./package.json').version;

const prime = process.env.PRIME;

const pl = process.env.PL || STANDARD;
const commit = process.env.COMMIT || 'head';
const perfTest = (process.env.PERF_TEST === 'true'); // Enable performance testing when in dev

// Allow skipping of eslint check
// 0 = Skip browser and console checks
// 1 = Skip browser check
// 2 = Do not skip any checks
const skipEsLintCheckStr = (process.env.SKIP_ESLINT || '');
const skipEsLintCheck = parseInt(skipEsLintCheckStr, 10) || 2;

// ===============================================================================================
// Nuxt configuration
// ===============================================================================================

// Expose a function that can be used by an app to provide a nuxt configuration for building an application
// This takes the directory of the application as tehfirst argument so that we can derive folder locations
// from it, rather than from the location of this file
export default function(dir, _appConfig) {
  // Paths to the shell folder when it is included as a node dependency
  let SHELL = 'node_modules/@rancher/shell';
  let SHELL_ABS = path.join(dir, 'node_modules/@rancher/shell');
  let NUXT_SHELL = '~~node_modules/@rancher/shell';
  let COMPONENTS_DIR = path.join(SHELL_ABS, 'rancher-components');
  let typescript = {};

  // If we have a local folder named 'shell' then use that rather than the one in node_modules
  // This will be the case in the main dashboard repository.
  if (fs.existsSync(path.join(dir, 'shell'))) {
    SHELL = './shell';
    SHELL_ABS = path.join(dir, 'shell');
    NUXT_SHELL = '~~/shell';
    COMPONENTS_DIR = path.join(dir, 'pkg', 'rancher-components', 'src', 'components');

    // Skip eslint check that runs as part of nuxt build in the console
    if (skipEsLintCheck > 0) {
      typescript = { typeCheck: { eslint: { files: './shell/**/*.{ts,js,vue}' } } };
    }
  }

  // ===============================================================================================
  // Functions for the UI Pluginas
  // ===============================================================================================

  const appConfig = _appConfig || {};
  const excludes = appConfig.excludes || [];
  const autoLoad = appConfig.autoLoad || [];

  const serverMiddleware = [];
  const autoLoadPackages = [];
  const watcherIgnores = [
    /.shell/,
    /dist-pkg/,
    /scripts\/standalone/
  ];

  autoLoad.forEach((pkg) => {
    // Need the version number of each file
    const pkgPackageFile = require(path.join(dir, 'pkg', pkg, 'package.json'));
    const pkgRef = `${ pkg }-${ pkgPackageFile.version }`;

    autoLoadPackages.push({
      name:    `app-autoload-${ pkgRef }`,
      content: `/pkg/${ pkgRef }/${ pkgRef }.umd.min.js`
    });

    // Anything auto-loaded should also be excluded
    if (!excludes.includes(pkg)) {
      excludes.push(pkg);
    }
  });

  // Find any UI packages in node_modules
  const NM = path.join(dir, 'node_modules');
  const pkg = require(path.join(dir, 'package.json'));
  const nmPackages = {};

  if (pkg && pkg.dependencies) {
    Object.keys(pkg.dependencies).forEach((pkg) => {
      const f = require(path.join(NM, pkg, 'package.json'));

      // The package.json must have the 'rancher' property to mark it as a UI package
      if (f.rancher) {
        const id = `${ f.name }-${ f.version }`;

        nmPackages[id] = f.main;

        // Add server middleware to serve up the files for this UI package
        serverMiddleware.push({
          path:    `/pkg/${ id }`,
          handler: serveStatic(path.join(NM, pkg))
        });
      }
    });
  }

  serverMiddleware.push({
    path:    '/uiplugins-catalog',
    handler: (req, res, next) => {
      const p = req.url.split('?');

      try {
        const proxy = createProxyMiddleware({
          target:      p[1],
          pathRewrite: { '^.*': p[0] }
        });

        return proxy(req, res, next);
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
      }
    }
  });

  function includePkg(name) {
    if (name.startsWith('.') || name === 'node_modules') {
      return false;
    }

    return !excludes || (excludes && !excludes.includes(name));
  }

  excludes.forEach((e) => {
    watcherIgnores.push(new RegExp(`/pkg.${ e }`));
  });

  // For each package in the pkg folder that is being compiled into the application,
  // Add in the code to automatically import the types from that package
  // This imports models, edit, detail, list etc
  // When built as a UI package, shell/pkg/vue.config.js does the same thing
  const autoImportTypes = {};
  const VirtualModulesPlugin = require('webpack-virtual-modules');
  let reqs = '';
  const pkgFolder = path.relative(dir, './pkg');

  if (fs.existsSync(pkgFolder)) {
    const items = fs.readdirSync(path.relative(dir, './pkg'));

    // Ignore hidden folders
    items.filter(name => !name.startsWith('.')).forEach((name) => {
      const f = require(path.join(dir, 'pkg', name, 'package.json'));

      // Package file must have rancher field to be a plugin
      if (includePkg(name) && f.rancher) {
        reqs += `$plugin.initPlugin('${ name }', require(\'~/pkg/${ name }\')); `;

        // // Serve the code for the UI package in case its used for dynamic loading (but not if the same package was provided in node_modules)
        // if (!nmPackages[name]) {
        //   const pkgPackageFile = require(path.join(dir, 'pkg', name, 'package.json'));
        //   const pkgRef = `${ name }-${ pkgPackageFile.version }`;

        //   serverMiddleware.push({ path: `/pkg/${ pkgRef }`, handler: serveStatic(`${ dir }/dist-pkg/${ pkgRef }`) });
        // }
        autoImportTypes[`@rancher/auto-import/${ name }`] = generateDynamicTypeImport(`@pkg/${ name }`, path.join(dir, `pkg/${ name }`));
      }
    });
  }

  Object.keys(nmPackages).forEach((m) => {
    reqs += `$plugin.loadAsync('${ m }', '/pkg/${ m }/${ nmPackages[m] }');`;
  });

  // Generate a virtual module '@rancher/dyanmic.js` which imports all of the packages that should be built into the application
  // This is imported in 'shell/extensions/extension-loader.js` which ensures the all code for plugins to be included is imported in the application
  const virtualModules = new VirtualModulesPlugin({ 'node_modules/@rancher/dynamic.js': `export default function ($plugin) { ${ reqs } };` });
  const autoImport = new webpack.NormalModuleReplacementPlugin(/^@rancher\/auto-import$/, (resource) => {
    const ctx = resource.context.split('/');
    const pkg = ctx[ctx.length - 1];

    resource.request = `@rancher/auto-import/${ pkg }`;
  });

  // @pkg imports must be resolved to the package that it importing them - this allows a package to use @pkg as an alis
  // to the root of that particular package
  const pkgImport = new webpack.NormalModuleReplacementPlugin(/^@pkg/, (resource) => {
    const ctx = resource.context.split('/');
    // Find 'pkg' folder in the contxt
    const index = ctx.findIndex(s => s === 'pkg');

    if (index !== -1 && (index + 1) < ctx.length) {
      const pkg = ctx[index + 1];
      const p = path.resolve(dir, 'pkg', pkg, resource.request.substr(5));

      resource.request = p;
    }
  });

  // Serve up the dist-pkg folder under /pkg
  serverMiddleware.push({ path: `/pkg/`, handler: serveStatic(`${ dir }/dist-pkg/`) });
  // Add the standard dashboard server middleware after the middleware added to serve up UI packages
  serverMiddleware.push(path.resolve(dir, SHELL, 'server', 'server-middleware'));

  // ===============================================================================================
  // Dashboard nuxt configuration
  // ===============================================================================================

  require('events').EventEmitter.defaultMaxListeners = 20;
  require('dotenv').config();

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
  const rancherEnv = process.env.RANCHER_ENV || 'web';

  console.log(`API: '${ api }'. Env: '${ rancherEnv }'`); // eslint-disable-line no-console

  // Nuxt modules
  let nuxtModules = [
    '@nuxtjs/proxy',
    '@nuxtjs/axios',
    '@nuxtjs/eslint-module',
    '@nuxtjs/webpack-profile',
    'cookie-universal-nuxt',
    'portal-vue/nuxt',
    path.join(NUXT_SHELL, 'plugins/dashboard-store/rehydrate-all'),
  ];

  // Remove es-lint nuxt module if env var configures this
  if (skipEsLintCheck < 2) {
    nuxtModules = nuxtModules.filter(s => !s.includes('eslint-module'));
  }

  const config = {
    dev,

    // Configuration visible to the client, https://nuxtjs.org/api/configuration-env
    env: {
      commit,
      version,
      dev,
      pl,
      perfTest,
      rancherEnv,
      harvesterPkgUrl: process.env.HARVESTER_PKG_URL,
      api
    },

    publicRuntimeConfig: { rancherEnv },

    buildDir: dev ? '.nuxt' : '.nuxt-prod',

    buildModules: [
      '@nuxtjs/style-resources',
      '@nuxt/typescript-build'
    ],
    styleResources: {
      // only import functions, mixins, or variables, NEVER import full styles https://github.com/nuxt-community/style-resources-module#warning
      hoistUseStatements: true,
      scss:               [
        path.resolve(SHELL_ABS, 'assets/styles/base/_variables.scss'),
        path.resolve(SHELL_ABS, 'assets/styles/base/_functions.scss'),
        path.resolve(SHELL_ABS, 'assets/styles/base/_mixins.scss'),
      ],
    },

    loadingIndicator: path.join(SHELL_ABS, 'static/loading-indicator.html'),

    loading: path.join(SHELL_ABS, 'components/nav/GlobalLoading.vue'),

    // Axios: https://axios.nuxtjs.org/options
    axios: {
      https: true,
      proxy: true,
      retry: { retries: 0 },
      // debug:   true
    },

    content: {
      dir:      path.resolve(SHELL_ABS, 'content'),
      markdown: { prism: { theme: false } },
      liveEdit: false
    },

    router: {
      base:          routerBasePath,
      middleware:    ['i18n'],
      prefetchLinks: false
    },

    alias: {
      '~shell':      SHELL_ABS,
      '@shell':      SHELL_ABS,
      '@pkg':        path.join(dir, 'pkg'),
      '@components': COMPONENTS_DIR,
    },

    modulesDir: [
      path.resolve(dir),
      './node_modules',
      SHELL_ABS
    ],

    dir: {
      assets:     path.posix.join(SHELL, 'assets'),
      layouts:    path.posix.join(SHELL, 'layouts'),
      middleware: path.posix.join(SHELL, 'middleware'),
      pages:      path.posix.join(SHELL, 'pages'),
      static:     path.posix.join(SHELL, 'static'),
      store:      path.posix.join(SHELL, 'store'),
    },

    watchers: { webpack: { ignore: watcherIgnores } },

    build: {
      publicPath: resourceBase,
      parallel:   true,
      cache:      true,
      hardSource: true,

      // Uses the Webpack Build Analyzer to generate a report of the bundle contents
      // analyze: { analyzerMode: 'static' },

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

      // Don't include `[name]` in prod file names
      // This flattens out the folder structure (avoids crazy paths like `_nuxt/pages/account/create-key/pages/c/_cluster/_product/_resource/_id/pages/c/_cluster/_product/_resource`)
      // and uses nuxt's workaround to address issues with filenames containing `//` (see https://github.com/nuxt/nuxt.js/issues/8274)
      filenames: { chunk: ({ isDev }) => isDev ? '[name].js' : '[contenthash].js' },
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

      plugins: [
        virtualModules,
        autoImport,
        new VirtualModulesPlugin(autoImportTypes),
        pkgImport,
      ],

      extend(config, { isClient, isDev }) {
        if ( isDev ) {
          config.devtool = 'cheap-module-source-map';
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

        config.resolve.symlinks = false;

        // Ensure we process files in the @rancher/shell folder
        config.module.rules.forEach((r) => {
          if ('test.js'.match(r.test)) {
            if (r.exclude) {
              const orig = r.exclude;

              r.exclude = function(modulePath) {
                if (modulePath.indexOf(SHELL_ABS) === 0) {
                  return false;
                }

                return orig(modulePath);
              };
            }
          }
        });

        // And substitute our own loader for images
        config.module.rules.unshift({
          test: /\.(png|jpe?g|gif|svg|webp)$/,
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

        // Handler for yaml files (used for i18n files, for example)
        config.module.rules.unshift({
          test:    /\.ya?ml$/i,
          loader:  'js-yaml-loader',
          options: { name: '[path][name].[ext]' },
        });

        // Handler for csv files (e.g. ec2 instance data)
        config.module.rules.unshift({
          test:    /\.csv$/i,
          loader:  'csv-loader',
          options: {
            dynamicTyping:  true,
            header:         true,
            skipEmptyLines: true
          },
        });

        // Ensure there is a fallback for browsers that don't support web workers
        config.module.rules.unshift({
          test:    /web-worker.[a-z-]+.js/i,
          loader:  'worker-loader',
          options: { inline: 'fallback' },
        });

        // Prevent warning in log with the md files in the content folder
        config.module.rules.push({
          test: /\.md$/,
          use:  [
            {
              loader:  'frontmatter-markdown-loader',
              options: { mode: ['body'] }
            }
          ]
        });
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
                corejs:  { version: 3 },
                targets: isServer ? { node: '12' } : { browsers: ['last 2 versions'] },
                modern:  !isServer
              }
            ],
            '@babel/preset-typescript',
          ];
        },
        plugins: [
          // TODO: Browser support
          // ['@babel/plugin-transform-modules-commonjs'],
          ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
          'babel-plugin-istanbul'
        ],
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
      path.resolve(SHELL_ABS, 'assets/styles/app.scss')
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
        },
        ...autoLoadPackages,
      ],
      link: [{
        hid:  'icon',
        rel:  'icon',
        type: 'image/x-icon',
        href: `${ resourceBase || '/' }favicon.png`
      }]
    },

    // Nuxt modules
    modules: nuxtModules,

    // Vue plugins
    plugins: [
      // Extensions
      path.relative(dir, path.join(SHELL, 'core/plugins.js')),
      path.relative(dir, path.join(SHELL, 'core/plugins-loader.js')), // Load builtin plugins

      // Third-party
      path.join(NUXT_SHELL, 'plugins/axios'),
      path.join(NUXT_SHELL, 'plugins/tooltip'),
      path.join(NUXT_SHELL, 'plugins/vue-clipboard2'),
      path.join(NUXT_SHELL, 'plugins/v-select'),
      path.join(NUXT_SHELL, 'plugins/directives'),
      path.join(NUXT_SHELL, 'plugins/transitions'),
      { src: path.join(NUXT_SHELL, 'plugins/vue-js-modal') },
      { src: path.join(NUXT_SHELL, 'plugins/js-yaml'), ssr: false },
      { src: path.join(NUXT_SHELL, 'plugins/resize'), ssr: false },
      { src: path.join(NUXT_SHELL, 'plugins/shortkey'), ssr: false },

      // First-party
      path.join(NUXT_SHELL, 'plugins/i18n'),
      path.join(NUXT_SHELL, 'plugins/global-formatters'),
      path.join(NUXT_SHELL, 'plugins/trim-whitespace'),
      { src: path.join(NUXT_SHELL, 'plugins/extend-router') },
      { src: path.join(NUXT_SHELL, 'plugins/console'), ssr: false },
      { src: path.join(NUXT_SHELL, 'plugins/int-number'), ssr: false },
      { src: path.join(NUXT_SHELL, 'plugins/nuxt-client-init'), ssr: false },
      path.join(NUXT_SHELL, 'plugins/replaceall'),
      path.join(NUXT_SHELL, 'plugins/back-button'),
      { src: path.join(NUXT_SHELL, 'plugins/plugin'), ssr: false }, // Load dyanmic plugins
      { src: path.join(NUXT_SHELL, 'plugins/codemirror-loader'), ssr: false },
      { src: path.join(NUXT_SHELL, 'plugins/formatters'), ssr: false }, // Populate formatters cache for sorted table
      { src: path.join(NUXT_SHELL, 'plugins/version'), ssr: false }, // Makes a fetch to the backend to get version metadata
    ],

    // Proxy: https://github.com/nuxt-community/proxy-module#options
    proxy: {
      ...appConfig.proxies,
      '/k8s':            proxyWsOpts(api), // Straight to a remote cluster (/k8s/clusters/<id>/)
      '/pp':             proxyWsOpts(api), // For (epinio) standalone API
      '/api':            proxyWsOpts(api), // Management k8s API
      '/apis':           proxyWsOpts(api), // Management k8s API
      '/v1':             proxyWsOpts(api), // Management Steve API
      '/v3':             proxyWsOpts(api), // Rancher API
      '/v3-public':      proxyOpts(api), // Rancher Unauthed API
      '/api-ui':         proxyOpts(api), // Browser API UI
      '/meta':           proxyMetaOpts(api), // Browser API UI
      '/v1-*':           proxyOpts(api), // SAML, KDM, etc
      '/rancherversion': proxyPrimeOpts(api), // Rancher version endpoint
      // These are for Ember embedding
      '/c/*/edit':       proxyOpts('https://127.0.0.1:8000'), // Can't proxy all of /c because that's used by Vue too
      '/k/':             proxyOpts('https://127.0.0.1:8000'),
      '/g/':             proxyOpts('https://127.0.0.1:8000'),
      '/n/':             proxyOpts('https://127.0.0.1:8000'),
      '/p/':             proxyOpts('https://127.0.0.1:8000'),
      '/assets':         proxyOpts('https://127.0.0.1:8000'),
      '/translations':   proxyOpts('https://127.0.0.1:8000'),
      '/engines-dist':   proxyOpts('https://127.0.0.1:8000'),
    },

    // Nuxt server
    server: {
      https: (devPorts ? {
        key:  fs.readFileSync(path.resolve(dir, SHELL, 'server/server.key')),
        cert: fs.readFileSync(path.resolve(dir, SHELL, 'server/server.crt'))
      } : null),
      port: (devPorts ? 8005 : 80),
      host: '0.0.0.0',
    },

    // Server middleware
    serverMiddleware,

    // Eslint module options
    eslint: {
      cache:   path.join(dir, 'node_modules/.cache/eslint'),
      exclude: [
        '.nuxt'
      ]
    },

    // Typescript eslint
    typescript,

    ssr: false,
  };

  return config;
}

// ===============================================================================================
// Functions for the request proxying used in dev
// ===============================================================================================

export function proxyMetaOpts(target) {
  return {
    target,
    followRedirects: true,
    secure:          !dev,
    onProxyReq,
    onProxyReqWs,
    onError,
    onProxyRes,
  };
}

export function proxyOpts(target) {
  return {
    target,
    secure: !devPorts,
    onProxyReq,
    onProxyReqWs,
    onError,
    onProxyRes,
  };
}

// Intercept the /rancherversion API call wnad modify the 'RancherPrime' value
// if configured to do so by the environment variable PRIME
export function proxyPrimeOpts(target) {
  const opts = proxyOpts(target);

  // Don't intercept if the PRIME environment variable is not set
  if (!prime?.length) {
    return opts;
  }

  opts.onProxyRes = (proxyRes, req, res) => {
    const _end = res.end;
    let body = '';

    proxyRes.on( 'data', (data) => {
      data = data.toString('utf-8');
      body += data;
    });

    res.write = () => {};

    res.end = () => {
      let output = body;

      try {
        const out = JSON.parse(body);

        out.RancherPrime = prime;
        output = JSON.stringify(out);
      } catch (err) {}

      res.setHeader('content-length', output.length );
      res.setHeader('content-type', 'application/json' );
      res.setHeader('transfer-encoding', '');
      res.setHeader('cache-control', 'no-cache');
      res.writeHead(proxyRes.statusCode);
      _end.apply(res, [output]);
    };
  };

  return opts;
}

export function onProxyRes(proxyRes, req, res) {
  if (devPorts) {
    proxyRes.headers['X-Frame-Options'] = 'ALLOWALL';
  }
}

export function proxyWsOpts(target) {
  return {
    ...proxyOpts(target),
    ws:           true,
    changeOrigin: true,
  };
}

export function onProxyReq(proxyReq, req) {
  if (!(proxyReq._currentRequest && proxyReq._currentRequest._headerSent)) {
    proxyReq.setHeader('x-api-host', req.headers['host']);
    proxyReq.setHeader('x-forwarded-proto', 'https');
    // console.log(proxyReq.getHeaders());
  }
}

export function onProxyReqWs(proxyReq, req, socket, options, head) {
  req.headers.origin = options.target.href;
  proxyReq.setHeader('origin', options.target.href);
  proxyReq.setHeader('x-api-host', req.headers['host']);
  proxyReq.setHeader('x-forwarded-proto', 'https');
  // console.log(proxyReq.getHeaders());

  socket.on('error', (err) => {
    console.error('Proxy WS Error:', err); // eslint-disable-line no-console
  });
}

export function onError(err, req, res) {
  res.statusCode = 598;
  console.error('Proxy Error:', err); // eslint-disable-line no-console
  res.write(JSON.stringify(err));
}
