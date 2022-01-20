import fs from 'fs';
import path from 'path';
import serveStatic from 'serve-static';
import webpack from 'webpack';
import { STANDARD } from './config/private-label';
import { directiveSsr as t } from './plugins/i18n';
import { trimWhitespaceSsr as trimWhitespace } from './plugins/trim-whitespace';
import { generateDynamicTypeImport } from './pkg/auto-import';

// ===============================================================================================
// Nuxt configuration
// ===============================================================================================

// Expose a function that can be used by an app to provide a nuxt configuration for building an application
// This takes the directory of the application as tehfirst argument so that we can derive folder locations
// from it, rather than from the location of this file
export default function(dir, _appConfig) {
  // Paths to the shell folder when it is included as a node dependency
  let SHELL = 'node_modules/@ranch/shell';
  let SHELL_ABS = path.join(dir, 'node_modules/@ranch/shell');
  let NUXT_SHELL = '~~node_modules/@ranch/shell';

  // If we have a local folder named 'shell' then use that rather than the one in node_modules
  // This will be the case in the main dashboard repository.
  if (fs.existsSync(path.join(dir, 'shell'))) {
    SHELL = './shell';
    SHELL_ABS = path.join(dir, 'shell');
    NUXT_SHELL = '~~/shell';
  }

  // ===============================================================================================
  // Functions for the UI Pluginas
  // ===============================================================================================

  const appConfig = _appConfig || {};
  const excludes = appConfig.excludes || [];
  const autoLoad = appConfig.autoLoad || [];

  const serverMiddleware = [];
  const autoLoadPackages = [];

  autoLoad.forEach((pkg) => {
    autoLoadPackages.push({
      name:    `app-autoload-${ pkg }`,
      content: `/pkg/${ pkg }/${ pkg }.umd.min.js`
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
        nmPackages[f.name] = f.main;

        // Add server middleware to serve up the files for this UI package
        serverMiddleware.push({
          path:    `/pkg/${ f.name }`,
          handler: serveStatic(path.join(NM, pkg))
        });
      }
    });
  }

  function includePkg(name) {
    if (name.startsWith('.') || name === 'node_modules') {
      return false;
    }

    return !excludes || (excludes && !excludes.includes(name));
  }

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

    items.forEach((name) => {
      if (includePkg(name)) {
        reqs += `require(\'~/pkg/${ name }\').default(app.router, store, $extension); `;
      }

      // Serve the code for the UI package in case its used for dynamic loading (but not if the same pacakge was provided in node_modules)
      if (!nmPackages[name]) {
        serverMiddleware.push({ path: `/pkg/${ name }`, handler: serveStatic(`${ dir }/dist-pkg/${ name }`) });
      }

      autoImportTypes[`@ranch/auto-import/${ name }`] = generateDynamicTypeImport(`@/pkg/${ name }`, path.join(dir, `pkg/${ name }`));
    });
  }

  Object.keys(nmPackages).forEach((m) => {
    reqs += `$extension.loadAsync('${ m }', '/pkg/${ m }/${ nmPackages[m] }');`;
  });

  // Generate a virtual module '@ranch/dyanmic.js` which imports all of the packages that should be built into the application
  // This is imported in 'shell/extensions/extension-loader.js` which ensures the all code for plugins to be included is imported in the application
  const virtualModules = new VirtualModulesPlugin({ 'node_modules/@ranch/dynamic.js': `export default function (store, app, $extension) { ${ reqs } };` });
  const autoImport = new webpack.NormalModuleReplacementPlugin(/^@ranch\/auto-import$/, (resource) => {
    const ctx = resource.context.split('/');
    const pkg = ctx[ctx.length - 1];

    resource.request = `@ranch/auto-import/${ pkg }`;
  });

  // Add the standard dashboard server middleware after the middleware added to serve up UI packages
  serverMiddleware.push(path.resolve(dir, SHELL, 'server', 'server-middleware'));

  // ===============================================================================================
  // Dashboard nuxt configuration
  // ===============================================================================================

  require('events').EventEmitter.defaultMaxListeners = 20;
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

  const config = {
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

    // mode:    'spa', --- Use --spa CLI flag, or ?spa query param.

    loading: path.join(SHELL_ABS, 'components/nav/GlobalLoading.vue'),

    // Axios: https://axios.nuxtjs.org/options
    axios: {
      https:          true,
      proxy:          true,
      retry:          { retries: 0 },
      // debug:   true
    },

    content: {
      dir:      path.resolve(SHELL_ABS, 'content'),
      markdown: { prism: { theme: false } },
      liveEdit: false
    },

    router: {
      base:       routerBasePath,
      middleware: ['i18n'],
    },

    alias: {
      '~shell': SHELL_ABS,
      '@shell': SHELL_ABS,
    },

    modulesDir: [
      path.resolve(dir),
      './node_modules',
      SHELL_ABS
    ],

    dir: {
      assets:     path.join(SHELL, 'assets'),
      layouts:    path.join(SHELL, 'layouts'),
      middleware: path.join(SHELL, 'middleware'),
      pages:      path.join(SHELL, 'pages'),
      static:     path.join(SHELL, 'static'),
      store:      path.join(SHELL, 'store'),
    },

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

      plugins: [
        virtualModules,
        autoImport,
        new VirtualModulesPlugin(autoImportTypes),
      ],

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

        // Any packages that have been excluded should be excluded from webpack watching, so you can edit those
        // without the app updating - you can then build their packages and test them dynamically
        if (excludes.length) {
          const excludePaths = [];

          excludes.forEach((e) => {
            excludePaths.push(path.resolve(dir, `pkg/${ e }/`));
            excludePaths.push(path.resolve(dir, `dist-pkg/${ e }/`));
            // excludePaths.push(new RegExp(`pkg/${ e }`));
            // excludePaths.push(new RegExp(`dist-pkg/${ e }`));
          });

          config.plugins.unshift(new webpack.WatchIgnorePlugin(excludePaths));
        }

        config.resolve.symlinks = false;

        // Ensure we process files in the @ranch/shell folder
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

        // And substitue our own loader for images
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

        // Add a loader for markdown files (revents warning in log with the md files in the content folder)
        config.module.rules.push({
          test:    /\.md$/,
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
                targets:     isServer ? { node: '12' } : { browsers: ['last 2 versions'] },
                modern:      !isServer
              }
            ],
            '@babel/preset-typescript',
          ];
        },
        plugins: [
          // TODO: Browser support
          // ['@babel/plugin-transform-modules-commonjs'],
          ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
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
    modules: [
      '@nuxtjs/proxy',
      '@nuxtjs/axios',
      '@nuxtjs/eslint-module',
      '@nuxtjs/webpack-profile',
      'cookie-universal-nuxt',
      'portal-vue/nuxt',
      path.join(NUXT_SHELL, 'plugins/steve/rehydrate-all'),
      '@nuxt/content',
    ],

    // Vue plugins
    plugins: [
      // Extensions
      path.relative(dir, path.join(SHELL, 'extensions/extension.js')),
      path.relative(dir, path.join(SHELL, 'extensions/extension-loader.js')),

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
      { src: path.join(NUXT_SHELL, 'plugins/lookup'), ssr: false },
      { src: path.join(NUXT_SHELL, 'plugins/int-number'), ssr: false },
      { src: path.join(NUXT_SHELL, 'plugins/nuxt-client-init'), ssr: false },
      path.join(NUXT_SHELL, 'plugins/replaceall'),
      path.join(NUXT_SHELL, 'plugins/back-button'),
      { src: path.join(NUXT_SHELL, 'plugins/extensions'), ssr: false },
      { src: path.join(NUXT_SHELL, 'plugins/codemirror-loader'), ssr: false },
    ],

    // Proxy: https://github.com/nuxt-community/proxy-module#options
    proxy: {
      '/k8s':          proxyWsOpts(api), // Straight to a remote cluster (/k8s/clusters/<id>/)
      '/api':          proxyWsOpts(api), // Management k8s API
      '/apis':         proxyWsOpts(api), // Management k8s API
      '/v1':           proxyWsOpts(api), // Management Steve API
      '/v3':           proxyWsOpts(api), // Rancher API
      '/v3-public':    proxyOpts(api), // Rancher Unauthed API
      '/api-ui':       proxyOpts(api), // Browser API UI
      '/meta':         proxyOpts(api), // Browser API UI
      '/v1-*':         proxyOpts(api), // SAML, KDM, etc
      // These are for Ember embedding
      '/c/*/edit':     proxyOpts('https://127.0.0.1:8000'), // Can't proxy all of /c because that's used by Vue too
      '/k/':           proxyOpts('https://127.0.0.1:8000'),
      '/g/':           proxyOpts('https://127.0.0.1:8000'),
      '/n/':           proxyOpts('https://127.0.0.1:8000'),
      '/p/':           proxyOpts('https://127.0.0.1:8000'),
      '/assets':       proxyOpts('https://127.0.0.1:8000'),
      '/translations': proxyOpts('https://127.0.0.1:8000'),
      '/engines-dist': proxyOpts('https://127.0.0.1:8000'),
    },

    // Nuxt server
    server: {
      https: (dev ? {
        key:  fs.readFileSync(path.resolve(dir, SHELL, 'server/server.key')),
        cert: fs.readFileSync(path.resolve(dir, SHELL, 'server/server.crt'))
      } : null),
      port:      (dev ? 8005 : 80),
      host:      '0.0.0.0',
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

    typescript: { typeCheck: { eslint: { files: './**/*.{ts,js,vue}' } } }
  };

  return config;

  // ===============================================================================================
  // Functions for the request proxying used in dev
  // ===============================================================================================

  function proxyOpts(target) {
    return {
      target,
      secure: !dev,
      onProxyReq,
      onProxyReqWs,
      onError,
      onProxyRes,
    };
  }

  function onProxyRes(proxyRes, req, res) {
    if (dev) {
      proxyRes.headers['X-Frame-Options'] = 'ALLOWALL';
    }
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
    res.statusCode = 598;
    console.error('Proxy Error:', err); // eslint-disable-line no-console
    res.write(JSON.stringify(err));
  }
}
