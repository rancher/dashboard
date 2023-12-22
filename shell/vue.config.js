const fs = require('fs');
const path = require('path');
const serveStatic = require('serve-static');
const webpack = require('webpack');
const { generateDynamicTypeImport } = require('./pkg/auto-import');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const serverMiddlewares = require('./server/server-middleware.js');
const configHelper = require('./vue-config-helper.js');
const har = require('./server/har-file');

// Suppress info level logging messages from http-proxy-middleware
// This hides all of the "[HPM Proxy created] ..." messages
const oldInfoLogger = console.info; // eslint-disable-line no-console

console.info = () => {}; // eslint-disable-line no-console

const { createProxyMiddleware } = require('http-proxy-middleware');

console.info = oldInfoLogger; // eslint-disable-line no-console

// This is currently hardcoded to avoid importing the TS
// const { STANDARD } = require('./config/private-label');
const STANDARD = 1;

const dev = configHelper.dev;
const devPorts = configHelper.devPorts;

// human readable version used on rancher dashboard about page
const dashboardVersion = process.env.DASHBOARD_VERSION;

const pl = process.env.PL || STANDARD;
const commit = process.env.COMMIT || 'head';
const perfTest = (process.env.PERF_TEST === 'true'); // Enable performance testing when in dev
const instrumentCode = (process.env.TEST_INSTRUMENT === 'true'); // Instrument code for code coverage in e2e tests

const api = configHelper.api;
// ===============================================================================================
// Nuxt configuration
// ===============================================================================================

// Expose a function that can be used by an app to provide a nuxt configuration for building an application
// This takes the directory of the application as tehfirst argument so that we can derive folder locations
// from it, rather than from the location of this file
module.exports = function(dir, _appConfig) {
  // Paths to the shell folder when it is included as a node dependency
  let SHELL = 'node_modules/@rancher/shell';
  let SHELL_ABS = path.join(dir, 'node_modules/@rancher/shell');
  let COMPONENTS_DIR = path.join(SHELL_ABS, 'rancher-components');

  if (fs.existsSync(SHELL_ABS)) {
    const stat = fs.lstatSync(SHELL_ABS);

    // If @rancher/shell is a symlink, then use the components folder for it
    if (stat.isSymbolicLink()) {
      const REAL_SHELL_ABS = fs.realpathSync(SHELL_ABS); // In case the shell is being linked via 'yarn link'

      COMPONENTS_DIR = path.join(REAL_SHELL_ABS, '..', 'pkg', 'rancher-components', 'src', 'components');
    }
  }

  // If we have a local folder named 'shell' then use that rather than the one in node_modules
  // This will be the case in the main dashboard repository.
  if (fs.existsSync(path.join(dir, 'shell'))) {
    SHELL = './shell';
    SHELL_ABS = path.join(dir, 'shell');
    COMPONENTS_DIR = path.join(dir, 'pkg', 'rancher-components', 'src', 'components');
  }

  const babelPlugins = [
    // TODO: Browser support
    // ['@babel/plugin-transform-modules-commonjs'],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
  ];

  if (instrumentCode) {
    babelPlugins.push([
      'babel-plugin-istanbul', { extension: ['.js', '.vue'] }, 'add-vue'
    ]);

    console.warn('Instrumenting code for coverage'); // eslint-disable-line no-console
  }

  // ===============================================================================================
  // Functions for the UI Pluginas
  // ===============================================================================================

  const appConfig = _appConfig || {};
  const excludes = appConfig.excludes || [];

  const serverMiddleware = [];
  const watcherIgnores = [
    /.shell/,
    /dist-pkg/,
    /scripts\/standalone/
  ];

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
    items.filter((name) => !name.startsWith('.')).forEach((name) => {
      const f = require(path.join(dir, 'pkg', name, 'package.json'));

      // Package file must have rancher field to be a plugin
      if (includePkg(name) && f.rancher) {
        reqs += `$plugin.initPlugin('${ name }', require(\'~/pkg/${ name }\')); `;
      }

      // // Serve the code for the UI package in case its used for dynamic loading (but not if the same package was provided in node_modules)
      // if (!nmPackages[name]) {
      //   const pkgPackageFile = require(path.join(dir, 'pkg', name, 'package.json'));
      //   const pkgRef = `${ name }-${ pkgPackageFile.version }`;

      //   serverMiddleware.push({ path: `/pkg/${ pkgRef }`, handler: serveStatic(`${ dir }/dist-pkg/${ pkgRef }`) });
      // }
      autoImportTypes[`node_modules/@rancher/auto-import/${ name }`] = generateDynamicTypeImport(`@pkg/${ name }`, path.join(dir, `pkg/${ name }`));
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
    const index = ctx.findIndex((s) => s === 'pkg');

    if (index !== -1 && (index + 1) < ctx.length) {
      const pkg = ctx[index + 1];
      let p = path.resolve(dir, 'pkg', pkg, resource.request.substr(5));

      if (resource.request.startsWith(`@pkg/${ pkg }`)) {
        p = path.resolve(dir, 'pkg', resource.request.substr(5));
      }

      resource.request = p;
    }
  });

  // Serve up the dist-pkg folder under /pkg
  serverMiddleware.push({ path: `/pkg/`, handler: serveStatic(`${ dir }/dist-pkg/`) });
  // Endpoint to download and unpack a tgz from the local verdaccio rgistry (dev)
  serverMiddleware.push(path.resolve(dir, SHELL, 'server', 'verdaccio-middleware'));

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
    console.log(`Version: ${ dashboardVersion }`); // eslint-disable-line no-console
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

  const loginLocaleSelector = process.env.LOGIN_LOCALE_SELECTOR || 'true';
  const excludeOperatorPkg = process.env.EXCLUDE_OPERATOR_PKG || 'false';

  console.log(`API: '${ api }'. Env: '${ rancherEnv }'`); // eslint-disable-line no-console
  const proxy = {
    ...appConfig.proxies,
    '/k8s':            configHelper.proxyWsOpts(api), // Straight to a remote cluster (/k8s/clusters/<id>/)
    '/pp':             configHelper.proxyWsOpts(api), // For (epinio) standalone API
    '/api':            configHelper.proxyWsOpts(api), // Management k8s API
    '/apis':           configHelper.proxyWsOpts(api), // Management k8s API
    '/v1':             configHelper.proxyWsOpts(api), // Management Steve API
    '/v3':             configHelper.proxyWsOpts(api), // Rancher API
    '/v3-public':      configHelper.proxyOpts(api), // Rancher Unauthed API
    '/api-ui':         configHelper.proxyOpts(api), // Browser API UI
    '/meta':           configHelper.proxyMetaOpts(api), // Browser API UI
    '/v1-*':           configHelper.proxyOpts(api), // SAML, KDM, etc
    '/rancherversion': configHelper.proxyPrimeOpts(api), // Rancher version endpoint
    // These are for Ember embedding
    '/c/*/edit':       configHelper.proxyOpts('https://127.0.0.1:8000'), // Can't proxy all of /c because that's used by Vue too
    '/k/':             configHelper.proxyOpts('https://127.0.0.1:8000'),
    '/g/':             configHelper.proxyOpts('https://127.0.0.1:8000'),
    '/n/':             configHelper.proxyOpts('https://127.0.0.1:8000'),
    '/p/':             configHelper.proxyOpts('https://127.0.0.1:8000'),
    '/assets':         configHelper.proxyOpts('https://127.0.0.1:8000'),
    '/translations':   configHelper.proxyOpts('https://127.0.0.1:8000'),
    '/engines-dist':   configHelper.proxyOpts('https://127.0.0.1:8000'),
  };

  // HAR File support - load network responses from the specified .har file and use those rather than communicating to the Rancher server
  const harFile = process.env.HAR_FILE;
  let harData;

  if (harFile) {
    harData = har.loadFile(harFile, devPorts ? 8005 : 80, ''); // eslint-disable-line no-console
  }

  const config = {
    // Vue server
    devServer: {
      https: (devPorts ? {
        key:  fs.readFileSync(path.resolve(__dirname, 'server/server.key')),
        cert: fs.readFileSync(path.resolve(__dirname, 'server/server.crt'))
      } : null),
      port:   (devPorts ? 8005 : 80),
      host:   '0.0.0.0',
      public: `https://0.0.0.0:${ devPorts ? 8005 : 80 }`,
      before(app, server) {
        const socketProxies = {};

        // Close down quickly in response to CTRL + C
        process.once('SIGINT', () => {
          server.close();
          console.log('\n'); // eslint-disable-line no-console
          process.exit(1);
        });

        app.use(serverMiddlewares);

        if (harData) {
          console.log('Installing HAR file middleware'); // eslint-disable-line no-console
          app.use(har.harProxy(harData, process.env.HAR_DIR));

          server.websocketProxies.push({
            upgrade(req, socket, head) {
              const responseHeaders = ['HTTP/1.1 101 Web Socket Protocol Handshake', 'Upgrade: WebSocket', 'Connection: Upgrade'];

              socket.write(`${ responseHeaders.join('\r\n') }\r\n\r\n`);
            }
          });
        }

        Object.keys(proxy).forEach((p) => {
          const px = createProxyMiddleware({
            ...proxy[p],
            ws: false // We will handle the web socket upgrade
          });

          if (proxy[p].ws) {
            socketProxies[p] = px;
          }
          app.use(p, px);
        });

        server.websocketProxies.push({
          upgrade(req, socket, head) {
            const path = Object.keys(socketProxies).find((path) => req.url.startsWith(path));

            if (path) {
              const proxy = socketProxies[path];

              if (proxy.upgrade) {
                proxy.upgrade(req, socket, head);
              } else {
                console.log(`Upgrade for Proxy is not defined. Cannot upgrade Web socket for ${ req.url }`); // eslint-disable-line no-console
              }
            } else {
              console.log(`Unknown Web socket upgrade request for ${ req.url }`); // eslint-disable-line no-console
            }
          }
        });
      },
    },
    publicPath: resourceBase || undefined,
    css:        {
      extract:       false, // inline css styles instead of including with `<links`
      loaderOptions: {
        sass: {
          // This is effectively added to the beginning of each style that's imported or included in a vue file. We may want to look into including these in app.scss
          additionalData: `
            @use 'sass:math';
            @import "~shell/assets/styles/base/_variables.scss";
            @import "~shell/assets/styles/base/_functions.scss";
            @import "~shell/assets/styles/base/_mixins.scss";
          `
        }
      }
    },

    outputDir,

    pages: {
      index: {
        entry:    path.join(SHELL_ABS, '/initialize/client.js'),
        template: path.join(SHELL_ABS, '/public/index.html')
      }
    },

    configureWebpack(config) {
      config.resolve.alias['~'] = dir;
      config.resolve.alias['@'] = dir;
      config.resolve.alias['~assets'] = path.join(__dirname, 'assets');
      config.resolve.alias['~shell'] = SHELL_ABS;
      config.resolve.alias['@shell'] = SHELL_ABS;
      config.resolve.alias['@pkg'] = path.join(dir, 'pkg');
      config.resolve.alias['./node_modules'] = path.join(dir, 'node_modules');
      config.resolve.alias['@components'] = COMPONENTS_DIR;
      config.resolve.alias['vue$'] = dev ? path.resolve(process.cwd(), 'node_modules', 'vue') : 'vue';
      config.resolve.modules.push(__dirname);
      config.plugins.push(virtualModules);
      config.plugins.push(autoImport);
      config.plugins.push(new VirtualModulesPlugin(autoImportTypes));
      config.plugins.push(pkgImport);
      // DefinePlugin does string replacement within our code. We may want to consider replacing it with something else. In code we'll see something like
      // process.env.commit even though process and env aren't even defined objects. This could cause people to be mislead.
      config.plugins.push(new webpack.DefinePlugin({
        'process.env.commit':              JSON.stringify(commit),
        'process.env.version':             JSON.stringify(dashboardVersion),
        'process.env.dev':                 JSON.stringify(dev),
        'process.env.pl':                  JSON.stringify(pl),
        'process.env.perfTest':            JSON.stringify(perfTest),
        'process.env.loginLocaleSelector': JSON.stringify(loginLocaleSelector),
        'process.env.excludeOperatorPkg':  JSON.stringify(excludeOperatorPkg),
        'process.env.rancherEnv':          JSON.stringify(rancherEnv),
        'process.env.harvesterPkgUrl':     JSON.stringify(process.env.HARVESTER_PKG_URL),
        'process.env.api':                 JSON.stringify(api),
        // Store the Router Base as env variable that we can use in `shell/config/router.js`
        'process.env.routerBase':          JSON.stringify(routerBasePath),

        // This is a replacement of the nuxt publicRuntimeConfig
        'nuxt.publicRuntimeConfig': JSON.stringify({
          rancherEnv,
          dashboardVersion
        }),

      }));

      // The static assets need to be in the built assets directory in order to get served (primarily the favicon)
      config.plugins.push(new CopyWebpackPlugin([{ from: path.join(SHELL_ABS, 'static'), to: '.' }]));

      config.resolve.extensions.push(...['.tsx', '.ts', '.js', '.vue', '.scss']);
      config.watchOptions = config.watchOptions || {};
      config.watchOptions.ignored = watcherIgnores;

      if (dev) {
        config.devtool = 'cheap-module-source-map';
      } else {
        config.devtool = 'source-map';
      }

      config.resolve.symlinks = false;

      // Ensure we process files in the @rancher/shell folder
      config.module.rules.forEach((r) => {
        if ('test.js'.match(r.test)) {
          if (r.exclude) {
            const orig = r.exclude;

            r.exclude = function(modulePath) {
              if (modulePath.indexOf(SHELL_ABS) === 0 || typeof orig !== 'function') {
                return false;
              }

              return orig(modulePath);
            };
          }
        }
      });

      // Instrument code for tests
      const babelPlugins = [
        // TODO: Browser support
        // ['@babel/plugin-transform-modules-commonjs'],
        ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
        ['@babel/plugin-proposal-class-properties', { loose: true }]
      ];

      if (instrumentCode) {
        babelPlugins.push([
          'babel-plugin-istanbul', { extension: ['.js', '.vue'] }, 'add-vue'
        ]);

        console.warn('Instrumenting code for coverage'); // eslint-disable-line no-console
      }

      const loaders = [
        // Ensure there is a fallback for browsers that don't support web workers
        {
          test:    /web-worker.[a-z-]+.js/i,
          loader:  'worker-loader',
          options: { inline: 'fallback' },
        },
        // Handler for csv files (e.g. ec2 instance data)
        {
          test:    /\.csv$/i,
          loader:  'csv-loader',
          options: {
            dynamicTyping:  true,
            header:         true,
            skipEmptyLines: true
          },
        },
        // Handler for yaml files (used for i18n files, for example)
        {
          test:    /\.ya?ml$/i,
          loader:  'js-yaml-loader',
          options: { name: '[path][name].[ext]' },
        },
        {
          test:    /\.m?[tj]sx?$/,
          // This excludes no modules except for node_modules/@rancher/... so that plugins can properly compile
          // when referencing @rancher/shell
          exclude: /node_modules\/(?!(@rancher)\/).*/,
          use:     [
            {
              loader:  'cache-loader',
              options: {
                cacheDirectory:  'node_modules/.cache/babel-loader',
                cacheIdentifier: 'e93f32da'
              }
            },
            {
              loader:  'babel-loader',
              options: {
                presets: [
                  [
                    require.resolve('@nuxt/babel-preset-app'),
                    {
                      corejs:  { version: 3 },
                      targets: { browsers: ['last 2 versions'] },
                      modern:  true
                    }
                  ],
                  '@babel/preset-typescript',
                ],
                plugins: babelPlugins
              }
            }
          ]
        },
        {
          test: /\.tsx?$/,
          use:  [
            {
              loader:  'cache-loader',
              options: {
                cacheDirectory:  'node_modules/.cache/ts-loader',
                cacheIdentifier: '3596741e'
              }
            },
            {
              loader:  'ts-loader',
              options: {
                transpileOnly:     true,
                happyPackMode:     false,
                appendTsxSuffixTo: [
                  '\\.vue$'
                ],
                configFile: path.join(SHELL_ABS, 'tsconfig.json')
              }
            }
          ]
        },
        // Prevent warning in log with the md files in the content folder
        {
          test: /\.md$/,
          use:  [
            {
              loader:  'frontmatter-markdown-loader',
              options: { mode: ['body'] }
            }
          ]
        },
      ];

      config.module.rules.push(...loaders);

      // Update vue-loader to set whitespace to 'preserve'
      // This was the setting with nuxt, but is not the default with vue cli
      // Need to find the vue loader in the webpack config and update the setting
      config.module.rules.forEach((loader) => {
        if (loader.use) {
          loader.use.forEach((use) => {
            if (use.loader.includes('vue-loader')) {
              use.options.compilerOptions.whitespace = 'preserve';
            }
          });
        }
      });
    },
  };

  return config;
};
