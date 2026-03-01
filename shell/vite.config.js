const fs = require('fs');
const path = require('path');
const vue = require('@vitejs/plugin-vue');
const { nodePolyfills } = require('vite-plugin-node-polyfills');
const { viteStaticCopy } = require('vite-plugin-static-copy');

// Custom Vite plugins
const { pkgImportResolver } = require('./vite-plugins/pkg-import-resolver');
const { rancherDynamicPlugin } = require('./vite-plugins/dynamic-modules');
const { rancherAutoImportPlugin } = require('./vite-plugins/auto-import');
const { yamlPlugin } = require('./vite-plugins/yaml-loader');
const { csvPlugin } = require('./vite-plugins/csv-loader');
const { markdownPlugin } = require('./vite-plugins/markdown-loader');
const { serverMiddlewarePlugin } = require('./vite-plugins/server-middleware');
const { dynamicImporterModulesPlugin } = require('./vite-plugins/dynamic-importer-modules');

// This is currently hardcoded to avoid importing the TS
const STANDARD = 1;

const dashboardVersion = process.env.DASHBOARD_VERSION;
const pl = process.env.PL || STANDARD;
const commit = process.env.COMMIT || 'head';
const perfTest = (process.env.PERF_TEST === 'true');

const dev = (process.env.NODE_ENV !== 'production');
const devPorts = dev || process.env.DEV_PORTS === 'true';
const prime = process.env.PRIME;

let api = process.env.API || 'http://localhost:8989';

if (!api.startsWith('http')) {
  api = `https://${ api }`;
}

/**
 * Resolve paths to the shell folder, handling both monorepo and node_modules cases
 */
function getShellPaths(dir) {
  let SHELL_ABS = path.join(dir, 'node_modules/@rancher/shell');
  let COMPONENTS_DIR = path.join(SHELL_ABS, 'rancher-components');

  if (fs.existsSync(SHELL_ABS)) {
    const stat = fs.lstatSync(SHELL_ABS);

    if (stat.isSymbolicLink()) {
      const REAL_SHELL_ABS = fs.realpathSync(SHELL_ABS);

      COMPONENTS_DIR = path.join(REAL_SHELL_ABS, '..', 'pkg', 'rancher-components', 'src', 'components');
    }
  }

  // If we have a local 'shell' folder, use that (monorepo case)
  if (fs.existsSync(path.join(dir, 'shell'))) {
    SHELL_ABS = path.join(dir, 'shell');
    COMPONENTS_DIR = path.join(dir, 'pkg', 'rancher-components', 'src', 'components');
  }

  return { SHELL_ABS, COMPONENTS_DIR };
}

/**
 * Build proxy configuration for the Vite dev server.
 */
function createProxyConfig(proxyConfig = {}) {
  function onProxyReq(proxyReq, req) {
    if (!(proxyReq._currentRequest && proxyReq._currentRequest._headerSent)) {
      proxyReq.setHeader('x-api-host', req.headers['host']);
      proxyReq.setHeader('x-forwarded-proto', 'https');
    }
  }

  function onProxyReqWs(proxyReq, req, socket, options) {
    req.headers.origin = options.target.href;
    proxyReq.setHeader('origin', options.target.href);
    proxyReq.setHeader('x-api-host', req.headers['host']);
    proxyReq.setHeader('x-forwarded-proto', 'https');

    socket.on('error', (err) => {
      console.error('Proxy WS Error:', err); // eslint-disable-line no-console
    });
  }

  function onProxyRes(proxyRes) {
    if (devPorts) {
      proxyRes.headers['X-Frame-Options'] = 'ALLOWALL';
    }
  }

  function onError(err, _req, res) {
    res.statusCode = 598;
    console.error('Proxy Error:', err); // eslint-disable-line no-console
    res.write(JSON.stringify(err));
  }

  function proxyOpts(target) {
    return {
      target,
      secure:       !devPorts,
      changeOrigin: true,
      configure:    (proxy) => {
        proxy.on('proxyReq', onProxyReq);
        proxy.on('proxyReqWs', onProxyReqWs);
        proxy.on('proxyRes', onProxyRes);
        proxy.on('error', onError);
      },
    };
  }

  function proxyWsOpts(target) {
    return {
      ...proxyOpts(target),
      ws: true,
    };
  }

  function proxyMetaOpts(target) {
    return {
      ...proxyOpts(target),
      followRedirects: true,
      secure:          !dev,
    };
  }

  function proxyPrimeOpts(target) {
    const opts = proxyOpts(target);

    if (!prime?.length) {
      return opts;
    }

    // Intercept /rancherversion to modify RancherPrime value
    return {
      ...opts,
      selfHandleResponse: true,
      configure:          (proxy) => {
        proxy.on('proxyReq', onProxyReq);
        proxy.on('proxyReqWs', onProxyReqWs);
        proxy.on('error', onError);
        proxy.on('proxyRes', (proxyRes, _req, res) => {
          onProxyRes(proxyRes);
          let body = '';

          proxyRes.on('data', (data) => {
            body += data.toString('utf-8');
          });
          proxyRes.on('end', () => {
            let output = body;

            try {
              const out = JSON.parse(body);

              out.RancherPrime = prime;
              output = JSON.stringify(out);
            } catch (err) {
              // Not JSON, pass through
            }

            res.setHeader('content-length', output.length);
            res.setHeader('content-type', 'application/json');
            res.removeHeader('transfer-encoding');
            res.setHeader('cache-control', 'no-cache');
            res.writeHead(proxyRes.statusCode);
            res.end(output);
          });
        });
      },
    };
  }

  return {
    ...proxyConfig,
    '/k8s':            proxyWsOpts(api),
    '/pp':             proxyWsOpts(api),
    '/api':            proxyWsOpts(api),
    '/apis':           proxyWsOpts(api),
    '/v1':             proxyWsOpts(api),
    '/v3':             proxyWsOpts(api),
    '/v3-public':      proxyOpts(api),
    '/api-ui':         proxyOpts(api),
    '/meta':           proxyMetaOpts(api),
    '/v1-':            proxyOpts(api),
    '/rancherversion': proxyPrimeOpts(api),
    '/version':        proxyPrimeOpts(api),
    // Ember embedding proxies
    '/c/*/edit':       proxyOpts('https://127.0.0.1:8000'),
    '/k/':             proxyOpts('https://127.0.0.1:8000'),
    '/g/':             proxyOpts('https://127.0.0.1:8000'),
    '/n/':             proxyOpts('https://127.0.0.1:8000'),
    '/p/':             proxyOpts('https://127.0.0.1:8000'),
    '/assets':         proxyOpts('https://127.0.0.1:8000'),
    '/translations':   proxyOpts('https://127.0.0.1:8000'),
    '/engines-dist':   proxyOpts('https://127.0.0.1:8000'),
  };
}

// Get current shell version for UI_EXTENSIONS_API_VERSION
const shellPkgData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')
);

/**
 * Create the Vite configuration for the Rancher Dashboard shell.
 *
 * This function mirrors the signature of the old vue.config.js export:
 *   module.exports = function(dir, appConfig = {})
 *
 * @param dir - The root directory of the application
 * @param appConfig - Configuration options (excludes, proxy, etc.)
 */
function createShellViteConfig(dir, appConfig = {}) {
  require('events').EventEmitter.defaultMaxListeners = 20;

  // Load .env files
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv may not be installed
  }

  const { SHELL_ABS, COMPONENTS_DIR } = getShellPaths(dir);
  const excludes = appConfig.excludes || [];

  const includePkg = (name) => {
    if (name.startsWith('.') || name === 'node_modules') {
      return false;
    }

    return !excludes.length || !excludes.includes(name);
  };

  const routerBasePath = process.env.ROUTER_BASE ?? '/';
  let resourceBase = process.env.RESOURCE_BASE ?? '';
  const outputDir = process.env.OUTPUT_DIR ?? 'dist';
  const rancherEnv = process.env.RANCHER_ENV || 'web';

  if (resourceBase && !resourceBase.endsWith('/')) {
    resourceBase += '/';
  }

  // Print build info
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

  const proxy = createProxyConfig(appConfig.proxy);

  return {
    root: dir,

    base: resourceBase || '/',

    publicDir: false, // We use vite-plugin-static-copy instead

    resolve: {
      // Use array format so more-specific aliases are matched before shorter ones
      // (e.g. '@shell' must match before '@', '~shell' before '~')
      alias: [
        { find: '@shell', replacement: SHELL_ABS },
        { find: '~shell', replacement: SHELL_ABS },
        { find: '@components', replacement: COMPONENTS_DIR },
        { find: '@pkg', replacement: path.join(dir, 'pkg') },
        { find: '~assets', replacement: path.join(SHELL_ABS, 'assets') },
        // Scoped npm packages referenced with ~ prefix in SCSS url() paths
        { find: '~@rancher', replacement: path.join(dir, 'node_modules', '@rancher') },
        { find: './node_modules', replacement: path.join(dir, 'node_modules') },
        { find: '~', replacement: dir },
        { find: '@', replacement: dir },
      ],
      extensions: ['.tsx', '.ts', '.js', '.vue', '.scss', '.json'],
      symlinks:   false,
    },

    define: {
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
      'process.env.routerBase':                JSON.stringify(routerBasePath),
      'process.browser':                       'true', // Nuxt compat — shell/utils/axios.js uses this to pick a relative baseURL TODO: Remove reference
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
    },

    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'mixed-decls', 'abs-percent'],
          additionalData:      `
            @use 'sass:math';
            @import "${ SHELL_ABS }/assets/styles/base/_variables.scss";
            @import "${ SHELL_ABS }/assets/styles/base/_functions.scss";
            @import "${ SHELL_ABS }/assets/styles/base/_mixins.scss";
          `,
        },
      },
    },

    plugins: [
      vue.default({
        template: {
          compilerOptions: {
            // Preserve inter-element whitespace so that adjacent inline
            // elements (e.g. label + subLabel spans in SortableTable THead)
            // keep a text node between them, matching webpack/vue-loader
            // behaviour that existing tests rely on.
            whitespace: 'preserve',
          },
        },
      }),

      // Custom Rancher plugins
      pkgImportResolver(dir),
      rancherDynamicPlugin(dir, includePkg),
      rancherAutoImportPlugin(dir),
      dynamicImporterModulesPlugin(SHELL_ABS),

      // Loader replacements
      yamlPlugin(),
      csvPlugin(),
      markdownPlugin(),

      // Node polyfills (replaces node-polyfill-webpack-plugin)
      nodePolyfills({
        include: ['process', 'buffer', 'util', 'stream', 'events', 'crypto', 'path', 'querystring', 'url', 'os'],
        globals: { process: true, Buffer: true },
      }),

      // Copy static assets (replaces CopyWebpackPlugin)
      viteStaticCopy({
        targets: [
          { src: path.join(SHELL_ABS, 'static', '*'), dest: '.' },
        ],
      }),

      // Dev server middleware
      serverMiddlewarePlugin(SHELL_ABS),
    ],

    server: {
      https: {
        key:  fs.readFileSync(path.resolve(SHELL_ABS, 'server/server.key')),
        cert: fs.readFileSync(path.resolve(SHELL_ABS, 'server/server.crt')),
      },
      port:  devPorts ? 8005 : 80,
      host:  '0.0.0.0',
      proxy,
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/dist-pkg/**',
          '**/scripts/standalone/**',
          '**/storybook/**',
          ...excludes.map((name) => `**/pkg/${ name }/**`),
        ],
      },
    },

    build: {
      outDir:        outputDir,
      sourcemap:     dev ? true : 'hidden',
      rollupOptions: {
        input:  path.join(dir, 'index.html'),
        output: {
          // Match webpack's asset directory structure so that existing
          // tests and integrations that reference /img/ paths still work.
          assetFileNames(assetInfo) {
            const ext = (assetInfo.name || '').split('.').pop();

            if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'].includes(ext)) {
              return 'img/[name]-[hash][extname]';
            }
            if (['woff', 'woff2', 'eot', 'ttf', 'otf'].includes(ext)) {
              return 'fonts/[name]-[hash][extname]';
            }

            return 'assets/[name]-[hash][extname]';
          },
        },
      },
    },

    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'vuex',
        'jquery',
        'jszip',
        'js-yaml',
        'axios',
        'lodash',
        'dayjs',
      ],
      exclude: ['@rancher/dynamic', '@rancher/dynamic-importer-modules', 'express', 'serve-static'],
    },
  };
}

module.exports = { createShellViteConfig };
