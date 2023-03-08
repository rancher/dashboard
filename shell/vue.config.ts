import fs from 'fs';
import path from 'path';
import serveStatic from 'serve-static';
import webpack from 'webpack';
import { STANDARD } from './config/private-label';
import { generateDynamicTypeImport } from './pkg/auto-import';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { createProxyMiddleware, RequestHandler, Options } from 'http-proxy-middleware';

const dev = (process.env.NODE_ENV !== 'production');
const devPorts = dev || process.env.DEV_PORTS === 'true';

// human readable version used on rancher dashboard about page
const dashboardVersion = process.env.DASHBOARD_VERSION;

const prime = process.env.PRIME;

const pl = process.env.PL || STANDARD;
const commit = process.env.COMMIT || 'head';
const perfTest = (process.env.PERF_TEST === 'true'); // Enable performance testing when in dev
const instrumentCode = (process.env.TEST_INSTRUMENT === 'true'); // Instrument code for code coverage in e2e tests

let api = process.env.API || 'http://localhost:8989';

if ( !api.startsWith('http') ) {
  api = `https://${ api }`;
}
// ===============================================================================================
// Nuxt configuration
// ===============================================================================================

// Expose a function that can be used by an app to provide a nuxt configuration for building an application
// This takes the directory of the application as tehfirst argument so that we can derive folder locations
// from it, rather than from the location of this file
export default function(dir: any, _appConfig: any) {
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

  const babelPlugins: string | (string | object)[] = [
    // TODO: Browser support
    // ['@babel/plugin-transform-modules-commonjs'],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }]
  ];

  if (instrumentCode) {
    babelPlugins.push('babel-plugin-istanbul');

    console.warn('Instrumenting code for coverage'); // eslint-disable-line no-console
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

  autoLoad.forEach((pkg: any) => {
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
  const nmPackages: any = {};

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
    handler: (req: any, res: any, next: any) => {
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

  function includePkg(name: any) {
    if (name.startsWith('.') || name === 'node_modules') {
      return false;
    }

    return !excludes || (excludes && !excludes.includes(name));
  }

  excludes.forEach((e: any) => {
    watcherIgnores.push(new RegExp(`/pkg.${ e }`));
  });

  // For each package in the pkg folder that is being compiled into the application,
  // Add in the code to automatically import the types from that package
  // This imports models, edit, detail, list etc
  // When built as a UI package, shell/pkg/vue.config.js does the same thing
  const autoImportTypes: any = {};
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
  const autoImport = new webpack.NormalModuleReplacementPlugin(/^@rancher\/auto-import$/, (resource: any) => {
    const ctx = resource.context.split('/');
    const pkg = ctx[ctx.length - 1];

    resource.request = `@rancher/auto-import/${ pkg }`;
  });

  // @pkg imports must be resolved to the package that it importing them - this allows a package to use @pkg as an alis
  // to the root of that particular package
  const pkgImport = new webpack.NormalModuleReplacementPlugin(/^@pkg/, (resource: any) => {
    const ctx = resource.context.split('/');
    // Find 'pkg' folder in the contxt
    const index = ctx.findIndex((s: any) => s === 'pkg');

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
    console.log(`Version: ${ dashboardVersion }`); // eslint-disable-line no-console
  }

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

  console.log(`API: '${ api }'. Env: '${ rancherEnv }'`); // eslint-disable-line no-console
  const proxy: { [path: string]: Options} = {
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
  };

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
      before(app: any, server: any) {
        const socketProxies: { [path: string]: RequestHandler} = {};

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
          upgrade(req: any, socket: any, head:any) {
            const path = Object.keys(socketProxies).find(path => req.url.startsWith(path));

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

    css: {
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
        entry:    path.join(SHELL_ABS, '/nuxt/client.js'),
        template: path.join(SHELL_ABS, '/public/index.html')
      }
    },

    configureWebpack(config: any) {
      config.resolve.alias['~'] = dir;
      config.resolve.alias['@'] = dir;
      config.resolve.alias['~assets'] = path.join(__dirname, 'assets');
      config.resolve.alias['~shell'] = SHELL_ABS;
      config.resolve.alias['@shell'] = SHELL_ABS;
      config.resolve.alias['@pkg'] = path.join(dir, 'pkg');
      config.resolve.alias['./node_modules'] = path.join(dir, 'node_modules');
      config.resolve.alias['@components'] = COMPONENTS_DIR;
      config.resolve.modules.push(__dirname);
      config.plugins.push(virtualModules);
      config.plugins.push(autoImport);
      config.plugins.push(new VirtualModulesPlugin(autoImportTypes));
      config.plugins.push(pkgImport);
      // DefinePlugin does string replacement within our code. We may want to consider replacing it with something else. In code we'll see something like
      // process.env.commit even though process and env aren't even defined objects. This could cause people to be mislead.
      config.plugins.push(new webpack.DefinePlugin({
        'process.client':              JSON.stringify(true),
        'process.env.commit':          JSON.stringify(commit),
        'process.env.version':         JSON.stringify(dashboardVersion),
        'process.env.dev':             JSON.stringify(dev),
        'process.env.pl':              JSON.stringify(pl),
        'process.env.perfTest':        JSON.stringify(perfTest),
        'process.env.rancherEnv':      JSON.stringify(rancherEnv),
        'process.env.harvesterPkgUrl': JSON.stringify(process.env.HARVESTER_PKG_URL),
        'process.env.api':             JSON.stringify(api),

        // This is a replacement of the nuxt publicRuntimeConfig
        'nuxt.publicRuntimeConfig': JSON.stringify({
          rancherEnv,
          dashboardVersion
        }),
      }));

      // The static assets need to be in the built public folder in order to get served (primarily the favicon for now)
      config.plugins.push(new CopyWebpackPlugin([{ from: path.join(SHELL_ABS, 'static'), to: 'public' }]));

      config.resolve.extensions.push(...['.tsx', '.ts', '.js', '.vue', '.scss']);
      config.watchOptions = config.watchOptions || {};
      config.watchOptions.ignored = watcherIgnores;

      if (dev) {
        config.devtool = 'cheap-module-source-map';
      } else {
        config.devtool = 'source-map';
      }

      if (resourceBase) {
        config.output.publicPath = resourceBase;
      }

      config.resolve.symlinks = false;

      // Ensure we process files in the @rancher/shell folder
      config.module.rules.forEach((r: any) => {
        if ('test.js'.match(r.test)) {
          if (r.exclude) {
            const orig = r.exclude;

            r.exclude = function(modulePath: string) {
              if (modulePath.indexOf(SHELL_ABS) === 0) {
                return false;
              }

              return orig(modulePath);
            };
          }
        }
      });

      // Instrument code for tests
      const babelPlugins: (string | ([] | Object)[])[] = [
        // TODO: Browser support
        // ['@babel/plugin-transform-modules-commonjs'],
        ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
        ['@babel/plugin-proposal-class-properties', { loose: true }]
      ];

      if (instrumentCode) {
        babelPlugins.push('babel-plugin-istanbul');

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
              loader:  'url-loader',
              options: {
                name:     '[path][name].[ext]',
                limit:    1,
                esModule: false
              },
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
        }
      ];

      config.module.rules.push(...loaders);
    },
  };

  return config;
}

// ===============================================================================================
// Functions for the request proxying used in dev
// ===============================================================================================

function proxyMetaOpts(target: any) {
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

function proxyOpts(target: any) {
  return {
    target,
    secure: !devPorts,
    onProxyReq,
    onProxyReqWs,
    onError,
    onProxyRes
  };
}

// Intercept the /rancherversion API call wnad modify the 'RancherPrime' value
// if configured to do so by the environment variable PRIME
function proxyPrimeOpts(target: any) {
  const opts = proxyOpts(target);

  // Don't intercept if the PRIME environment variable is not set
  if (!prime?.length) {
    return opts;
  }

  opts.onProxyRes = (proxyRes, req, res) => {
    const _end = res.end;
    let body = '';

    proxyRes.on( 'data', (data: any) => {
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

function onProxyRes(proxyRes: any, req: any, res: any) {
  if (devPorts) {
    proxyRes.headers['X-Frame-Options'] = 'ALLOWALL';
  }
}

function proxyWsOpts(target: any) {
  return {
    ...proxyOpts(target),
    ws:           true,
    changeOrigin: true,
  };
}

function onProxyReq(proxyReq: any, req: any) {
  if (!(proxyReq._currentRequest && proxyReq._currentRequest._headerSent)) {
    proxyReq.setHeader('x-api-host', req.headers['host']);
    proxyReq.setHeader('x-forwarded-proto', 'https');
  }
}

function onProxyReqWs(proxyReq: any, req: any, socket: any, options: any, head: any) {
  req.headers.origin = options.target.href;
  proxyReq.setHeader('origin', options.target.href);
  proxyReq.setHeader('x-api-host', req.headers['host']);
  proxyReq.setHeader('x-forwarded-proto', 'https');
  // console.log(proxyReq.getHeaders());

  socket.on('error', (err: any) => {
    console.error('Proxy WS Error:', err); // eslint-disable-line no-console
  });
}

function onError(err: any, req: any, res: any) {
  res.statusCode = 598;
  console.error('Proxy Error:', err); // eslint-disable-line no-console
  res.write(JSON.stringify(err));
}
