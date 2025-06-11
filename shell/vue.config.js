const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const { generateDynamicTypeImport } = require('./pkg/auto-import');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const serverMiddlewares = require('./server/server-middleware.js');
const {
  dev, devPorts, api, proxyWsOpts, proxyOpts, proxyMetaOpts, proxyPrimeOpts
} = require('./vue-config-helper.js');
const har = require('./server/har-file');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const VirtualModulesPlugin = require('webpack-virtual-modules');

// Suppress info level logging messages from http-proxy-middleware
// This hides all of the "[HPM Proxy created] ..." messages
const oldInfoLogger = console.info; // eslint-disable-line no-console

console.info = () => {}; // eslint-disable-line no-console

const { createProxyMiddleware } = require('http-proxy-middleware');

// TODO: Add explanation of this logic
console.info = oldInfoLogger; // eslint-disable-line no-console

// This is currently hardcoded to avoid importing the TS
// const { STANDARD } = require('./config/private-label');
const STANDARD = 1;

// human readable version used on rancher dashboard about page
const dashboardVersion = process.env.DASHBOARD_VERSION;

const pl = process.env.PL || STANDARD;
const commit = process.env.COMMIT || 'head';
const perfTest = (process.env.PERF_TEST === 'true'); // Enable performance testing when in dev

/**
 * Paths to the shell folder when it is included as a node dependency
 */
const getShellPaths = (dir) => {
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
    SHELL_ABS = path.join(dir, 'shell');
    COMPONENTS_DIR = path.join(dir, 'pkg', 'rancher-components', 'src', 'components');
  }

  return { SHELL_ABS, COMPONENTS_DIR };
};

const getProxyConfig = (proxyConfig) => ({
  ...proxyConfig,
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
  '/version':        proxyPrimeOpts(api), // Rancher Kube version endpoint
  // These are for Ember embedding
  '/c/*/edit':       proxyOpts('https://127.0.0.1:8000'), // Can't proxy all of /c because that's used by Vue too
  '/k/':             proxyOpts('https://127.0.0.1:8000'),
  '/g/':             proxyOpts('https://127.0.0.1:8000'),
  '/n/':             proxyOpts('https://127.0.0.1:8000'),
  '/p/':             proxyOpts('https://127.0.0.1:8000'),
  '/assets':         proxyOpts('https://127.0.0.1:8000'),
  '/translations':   proxyOpts('https://127.0.0.1:8000'),
  '/engines-dist':   proxyOpts('https://127.0.0.1:8000'),
});

/**
 * @pkg imports must be resolved to the package that it importing them - this allows a package to use @pkg as an alias
 * to the root of that particular package
 */
const getPackageImport = (dir) => new webpack.NormalModuleReplacementPlugin(/^@pkg/, (resource) => {
  const ctx = resource.context.split('/');
  // Find 'pkg' folder in the context
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

/**
 * Instrument code for code coverage in e2e tests
 */
const instrumentCode = () => {
  const instrumentedCode = (process.env.TEST_INSTRUMENT === 'true');

  // Instrument code for tests
  const babelPlugins = [
    // TODO: Browser support; also add explanation to this TODO
    // ['@babel/plugin-transform-modules-commonjs'],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }]
  ];

  if (instrumentedCode) {
    babelPlugins.push([
      'babel-plugin-istanbul', { extension: ['.js', '.vue'] }, 'add-vue'
    ]);

    console.warn('Instrumenting code for coverage'); // eslint-disable-line no-console
  }
};

const getLoaders = (SHELL_ABS) => [
  // no fallback for pre-2013 browsers https://caniuse.com/webworkers
  {
    test:    /web-worker.[a-z-]+.js/i,
    loader:  'worker-loader',
    options: { inline: 'no-fallback' },
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

const getDevServerConfig = (proxy) => {
  const harFile = process.env.HAR_FILE;
  // HAR File support - load network responses from the specified .har file and use those rather than communicating to the Rancher server
  const harData = harFile ? har.loadFile(harFile, devPorts ? 8005 : 80, '') : undefined;

  return {
    client: { webSocketURL: { hostname: '0.0.0.0', port: devPorts ? 8005 : 80 } },
    server: {
      type:    'https',
      options: {
        key:  fs.readFileSync(path.resolve(__dirname, 'server/server.key')),
        cert: fs.readFileSync(path.resolve(__dirname, 'server/server.crt'))
      }
    },
    port: (devPorts ? 8005 : 80),
    host: '0.0.0.0',
    setupMiddlewares(middlewares, devServer) {
      const socketProxies = {};

      if (!devServer) {
        // eslint-disable-next-line no-console
        console.error('webpack-dev-server is not defined');

        return middlewares;
      }

      const app = devServer.app;

      // Close down quickly in response to CTRL + C
      process.once('SIGINT', () => {
        devServer.close();
        console.log('\n'); // eslint-disable-line no-console
        process.exit(1);
      });

      app.use(serverMiddlewares);

      if (harData) {
        console.log('Installing HAR file middleware'); // eslint-disable-line no-console
        app.use(har.harProxy(harData, process.env.HAR_DIR));

        devServer.webSocketProxies.push({
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

      // TODO: Verify after migration completed
      devServer.webSocketProxies.push({
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

      return middlewares;
    }
  };
};

/**
 * Generate a virtual module '@rancher/dynamic.js` which imports all of the packages that should be built into the application
 * This is imported in 'shell/extensions/extension-loader.js` which ensures the all code for plugins to be included is imported in the application
 */
const getVirtualModules = (dir, includePkg) => {
  // Find any UI packages in node_modules
  const modulePaths = path.join(dir, 'node_modules');
  const requiredPackages = require(path.join(dir, 'package.json'));
  const librariesIndex = {};

  if (requiredPackages && requiredPackages.dependencies) {
    Object.keys(requiredPackages.dependencies).forEach((requiredPackage) => {
      const library = require(path.join(modulePaths, requiredPackage, 'package.json'));

      // The package.json must have the 'rancher' property to mark it as a UI package
      if (library.rancher) {
        const id = `${ library.name }-${ library.version }`;

        librariesIndex[id] = library.main;
      }
    });
  }

  let reqs = '';
  const pkgFolder = path.relative(dir, './pkg');

  if (fs.existsSync(pkgFolder)) {
    fs.readdirSync(pkgFolder)
      .filter((name) => !name.startsWith('.')) // Ignore hidden folders
      .forEach((name) => {
        const library = require(path.join(dir, 'pkg', name, 'package.json'));

        // Package file must have rancher field to be a plugin
        if (includePkg(name) && library.rancher) {
          reqs += `$plugin.registerBuiltinExtension('${ name }', require(\'~/pkg/${ name }\')); `;
        }
      });
  }

  Object.keys(librariesIndex).forEach((i) => {
    reqs += `$plugin.loadAsync('${ i }', '/pkg/${ i }/${ librariesIndex[i] }');`;
  });

  return new VirtualModulesPlugin({ 'node_modules/@rancher/dynamic.js': `export default function ($plugin) { ${ reqs } };` });
};

const getAutoImport = () => new webpack.NormalModuleReplacementPlugin(/^@rancher\/auto-import$/, (resource) => {
  const ctx = resource.context.split('/');
  const pkg = ctx[ctx.length - 1];

  resource.request = `@rancher/auto-import/${ pkg }`;
});

/**
 * For each package in the pkg folder that is being compiled into the application,
 * Add in the code to automatically import the types from that package
 * This imports models, edit, detail, list etc
 * When built as a UI package, shell/pkg/vue.config.js does the same thing
 */
const getVirtualModulesAutoImport = (dir) => {
  const autoImportTypes = {};
  const pkgFolder = path.relative(dir, './pkg');

  if (fs.existsSync(pkgFolder)) {
    fs.readdirSync(pkgFolder)
      .filter((name) => !name.startsWith('.')) // Ignore hidden folders
      .forEach((name) => {
        autoImportTypes[`node_modules/@rancher/auto-import/${ name }`] = generateDynamicTypeImport(`@pkg/${ name }`, path.join(dir, `pkg/${ name }`));
      });
  }

  return new VirtualModulesPlugin(autoImportTypes);
};

// Get current shell version
const shellPkgData = require(path.join(__dirname, 'package.json'));

/**
 * DefinePlugin does string replacement within our code. We may want to consider replacing it with something else. In code we'll see something like
 * process.env.commit even though process and env aren't even defined objects. This could cause people to be mislead.
 */
const createEnvVariablesPlugin = (routerBasePath, rancherEnv) => new webpack.DefinePlugin({
  'process.env.commit':                    JSON.stringify(commit),
  'process.env.version':                   JSON.stringify(dashboardVersion),
  'process.env.dev':                       JSON.stringify(dev),
  'process.env.pl':                        JSON.stringify(pl),
  'process.env.perfTest':                  JSON.stringify(perfTest),
  'process.env.loginLocaleSelector':       JSON.stringify(process.env.LOGIN_LOCALE_SELECTOR || 'true'),
  'process.env.excludeOperatorPkg':        JSON.stringify(process.env.EXCLUDE_OPERATOR_PKG || 'false'),
  'process.env.rancherEnv':                JSON.stringify(rancherEnv),
  'process.env.harvesterPkgUrl':           JSON.stringify(process.env.HARVESTER_PKG_URL),
  'process.env.api':                       JSON.stringify(api),
  'process.env.UI_EXTENSIONS_API_VERSION': JSON.stringify(shellPkgData.version),
  // Store the Router Base as env variable that we can use in `shell/config/router.js`
  'process.env.routerBase':                JSON.stringify(routerBasePath),
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
});

/**
 * Ensure we process files in the @rancher/shell folder
 */
const processShellFiles = (config, SHELL_ABS) => {
  config.module.rules.forEach((rule) => {
    if ('test.js'.match(rule.test)) {
      if (rule.exclude) {
        const orig = rule.exclude;

        rule.exclude = function(modulePath) {
          if (modulePath.indexOf(SHELL_ABS) === 0 || typeof orig !== 'function') {
            return false;
          }

          return orig(modulePath);
        };
      }
    }
  });
};

/**
 * Update vue-loader to set whitespace to 'preserve'
 * This was the setting with nuxt, but is not the default with vue cli
 * Need to find the vue loader in the webpack config and update the setting
 */
const preserveWhitespace = (config) => {
  config.module.rules.forEach((loader) => {
    if (loader.use) {
      loader.use.forEach((use) => {
        if (use.loader.includes('vue-loader')) {
          use.options.compilerOptions = { ...use.options.compilerOptions, whitespace: 'preserve' };
        }
      });
    }
  });
};

const printLogs = (dev, dashboardVersion, resourceBase, routerBasePath, pl, rancherEnv) => {
  console.log(`Build: ${ dev ? 'Development' : 'Production' }`); // eslint-disable-line no-console

  if (!dev) {
    console.log(`Version: ${ dashboardVersion }`); // eslint-disable-line no-console
  }

  if (resourceBase) {
    console.log(`Resource Base URL: ${ resourceBase }`); // eslint-disable-line no-console
  }

  if (routerBasePath !== '/') {
    console.log(`Router Base Path: ${ routerBasePath }`); // eslint-disable-line no-console
  }

  if (pl !== STANDARD) {
    console.log(`PL: ${ pl }`); // eslint-disable-line no-console
  }

  console.log(`API: '${ api }'. Env: '${ rancherEnv }'`); // eslint-disable-line no-console
};

/**
 * Add ignored paths based on env var configuration and known cases
 * TODO: Verify after migration completed
 * In Webpack5 only RegExp, string and [string] types are accepted
 * https://webpack.js.org/configuration/watch/#watchoptionsignored
 * Example conversion:
 * - as list: [/.shell/, /dist-pkg/, /scripts\/standalone/, /\/pkg.test-pkg/, /\/pkg.harvester/]
 * - as chained regex rule: /.shell|dist-pkg|scripts\/standalone|\/pkg.test-pkg|\/pkg.harvester/
 */
const getWatcherIgnored = (excludes = []) => {
  const paths = [
    /node_modules/,
    /dist-pkg/,
    /scripts\/standalone/,
  ];
  const pathExcludedPkg = excludes.map((excluded) => new RegExp(`/pkg.${ excluded }/`));
  const pathsCombined = [...paths, ...pathExcludedPkg];
  const regexCombined = new RegExp(pathsCombined.map(({ source }) => source).join('|'));

  return regexCombined;
};

/**
 * Expose a function that can be used by an app to provide a nuxt configuration for building an application
 * This takes the directory of the application as the first argument so that we can derive folder locations
 * from it, rather than from the location of this file
 */
module.exports = function(dir, appConfig = {}) {
  require('events').EventEmitter.defaultMaxListeners = 20;
  require('dotenv').config();

  const { SHELL_ABS, COMPONENTS_DIR } = getShellPaths(dir);
  const excludes = appConfig.excludes || [];

  const includePkg = (name) => {
    if (name.startsWith('.') || name === 'node_modules') {
      return false;
    }

    return !excludes || (excludes && !excludes.includes(name));
  };

  const routerBasePath = process.env.ROUTER_BASE ?? '/';
  let resourceBase = process.env.RESOURCE_BASE ?? '';
  const outputDir = process.env.OUTPUT_DIR ?? 'dist';
  const rancherEnv = process.env.RANCHER_ENV || 'web';

  if ( resourceBase && !resourceBase.endsWith('/') ) {
    resourceBase += '/';
  }

  printLogs(dev, dashboardVersion, resourceBase, routerBasePath, pl, rancherEnv);

  const proxy = getProxyConfig(appConfig.proxy);
  const config = {
    // Vue server
    devServer:  getDevServerConfig(proxy),
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
            @import 'node_modules/xterm/css/xterm.css';
          `
        }
      }
    },
    outputDir,
    pages: {
      index: {
        entry:    path.join(SHELL_ABS, '/initialize/entry.js'),
        template: path.join(SHELL_ABS, '/public/index.html')
      }
    },
    configureWebpack(config) {
      // TODO VUE3: We may want to look into what we want the value to actually be. For the time being this was causing a warning in our CLI because it would set process.env.NODE_ENV to 'development' even thought it was
      //            already set to 'dev' and we're using 'dev' in other locations so I don't think we want to do that. Config details found here: https://webpack.js.org/configuration/optimization/#optimizationnodeenv.
      config.optimization.nodeEnv = false;
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
      config.plugins.push(getVirtualModules(dir, includePkg));
      config.plugins.push(getAutoImport());
      config.plugins.push(getVirtualModulesAutoImport(dir));
      config.plugins.push(getPackageImport(dir));
      config.plugins.push(createEnvVariablesPlugin(routerBasePath, rancherEnv));
      config.plugins.push(new NodePolyfillPlugin()); // required from Webpack 5 to polyfill node modules

      // The static assets need to be in the built assets directory in order to get served (primarily the favicon)
      config.plugins.push(new CopyWebpackPlugin({ patterns: [{ from: path.join(SHELL_ABS, 'static'), to: '.' }] }));

      config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /\/__tests__\// }));

      config.resolve.extensions.push(...['.tsx', '.ts', '.js', '.vue', '.scss']);
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: getWatcherIgnored()
      };

      if (dev) {
        config.devtool = 'cheap-module-source-map';
      } else {
        config.devtool = 'source-map';
      }

      config.resolve.symlinks = false;
      processShellFiles(config, SHELL_ABS);
      instrumentCode();
      config.module.rules.push(...getLoaders(SHELL_ABS));
      preserveWhitespace(config);
    },
  };

  return config;
};
