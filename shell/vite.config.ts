/**
 * Vite equivalent of shell/vue.config.js. Exposes a function that an app can
 * use to create its Vite configuration, taking the app directory as the first
 * argument so folder locations are derived from it.
 *
 * The webpack config (shell/vue.config.js) remains the default (yarn dev /
 * yarn build) and is still used for building extensions (build-pkg); Vite is
 * opt-in via yarn dev:vite / build:vite.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import type { ConfigEnv, UserConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

import webpackCompatPlugin from './vite/webpack-compat-plugin';
import {
  yamlPlugin, workerPlugin, pkgAliasPlugin, virtualModulesPlugin, serverMiddlewarePlugin, htmlPlugin
} from './vite/plugins';

const require = createRequire(import.meta.url);
const SHELL_DIR = path.dirname(fileURLToPath(import.meta.url));

const { devPorts, api, getStandardProxies } = require('./vue-config-helper.js');
const serverMiddlewares = require('./server/server-middleware.js');
const shellPkgData = require('./package.json');

// This is currently hardcoded to avoid importing the TS (see shell/config/private-label)
const STANDARD = 1;

const getShellPaths = (dir: string) => {
  let SHELL_ABS = path.join(dir, 'node_modules/@rancher/shell');
  let COMPONENTS_DIR = path.join(SHELL_ABS, 'rancher-components');

  if (fs.existsSync(SHELL_ABS)) {
    const stat = fs.lstatSync(SHELL_ABS);

    if (stat.isSymbolicLink()) {
      const REAL_SHELL_ABS = fs.realpathSync(SHELL_ABS);

      COMPONENTS_DIR = path.join(REAL_SHELL_ABS, '..', 'pkg', 'rancher-components', 'src', 'components');
    }
  }

  if (fs.existsSync(path.join(dir, 'shell'))) {
    SHELL_ABS = path.join(dir, 'shell');
    COMPONENTS_DIR = path.join(dir, 'pkg', 'rancher-components', 'src', 'components');
  }

  return { SHELL_ABS, COMPONENTS_DIR };
};

interface AppConfig {
  excludes?: string[];
  proxy?: Record<string, any>;
}

/**
 * Convert the express/http-proxy-middleware style proxy table used by the
 * webpack dev server into Vite's server.proxy format. Keys become regular
 * expressions with path-segment boundaries to match express' app.use()
 * semantics (so '/v1' does not swallow '/v1-something').
 */
function toViteProxy(proxies: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};

  Object.entries(proxies).forEach(([context, opts]) => {
    const {
      onProxyReq, onProxyReqWs, onProxyRes, onError, ...rest
    } = opts;

    const key = context.includes('*') ? `^${ context.replace(/\*/g, '.*') }` : `^${ context }(/|$)`;

    out[key] = {
      ...rest,
      configure(proxy: any) {
        if (onProxyReq) {
          proxy.on('proxyReq', onProxyReq);
        }
        if (onProxyReqWs) {
          proxy.on('proxyReqWs', onProxyReqWs);
        }
        if (onProxyRes) {
          proxy.on('proxyRes', onProxyRes);
        }
        if (onError) {
          proxy.on('error', onError);
        }
      },
    };
  });

  return out;
}

/**
 * Expose a function that can be used by an app to provide the Vite configuration
 * for building the application (mirrors module.exports of shell/vue.config.js).
 */
export default function config(dir: string, appConfig: AppConfig = {}) {
  const { SHELL_ABS, COMPONENTS_DIR } = getShellPaths(dir);
  const excludes = appConfig.excludes || [];

  const includePkg = (name: string): boolean => {
    if (name.startsWith('.') || name === 'node_modules') {
      return false;
    }

    return !excludes || (excludes && !excludes.includes(name));
  };

  return ({ command, mode }: ConfigEnv): UserConfig => {
    const dev = command === 'serve' ? process.env.NODE_ENV !== 'production' : mode !== 'production';

    const dashboardVersion = process.env.DASHBOARD_VERSION;
    const commit = process.env.COMMIT || 'head';
    const perfTest = (process.env.PERF_TEST === 'true');
    const pl = process.env.PL || STANDARD;
    const routerBasePath = process.env.ROUTER_BASE ?? '/';
    let resourceBase = process.env.RESOURCE_BASE ?? '';
    const outputDir = process.env.OUTPUT_DIR ?? 'dist';
    const rancherEnv = process.env.RANCHER_ENV || 'web';

    if (resourceBase && !resourceBase.endsWith('/')) {
      resourceBase += '/';
    }

    console.log(`Build: ${ dev ? 'Development' : 'Production' } (vite)`); // eslint-disable-line no-console
    console.log(`API: '${ api }'. Env: '${ rancherEnv }'`); // eslint-disable-line no-console

    return {
      root:      dir,
      base:      resourceBase || '/',
      publicDir: path.join(SHELL_ABS, 'static'),

      plugins: [
        htmlPlugin(SHELL_ABS),
        yamlPlugin(),
        vue({ template: { compilerOptions: { whitespace: 'preserve' } } }),
        workerPlugin(),
        pkgAliasPlugin(dir),
        virtualModulesPlugin(dir, includePkg),
        webpackCompatPlugin({ dir, shellAbs: SHELL_ABS }),
        // Equivalent of the dynamic-importer / model-loader-require overrides in
        // shell/pkg/vue.config.js: swap in the import.meta.glob based implementations
        {
          name:    'rancher:webpack-module-overrides',
          enforce: 'pre',
          async resolveId(source, importer) {
            if (source.endsWith('utils/dynamic-importer') && !importer?.endsWith('dynamic-importer.vite.js')) {
              return path.join(SHELL_ABS, 'utils/dynamic-importer.vite.js');
            }

            if (source.endsWith('/model-loader-require') && !importer?.endsWith('model-loader-require.vite.js')) {
              return path.join(SHELL_ABS, 'plugins/dashboard-store/model-loader-require.vite.js');
            }

            return null;
          },
        },
        serverMiddlewarePlugin(serverMiddlewares),
      ],

      resolve: {
        alias: [
          { find: '~assets', replacement: path.join(SHELL_DIR, 'assets') },
          { find: '~shell', replacement: SHELL_ABS },
          // css url('~@shell/...') / url('~@rancher/icons/...') references
          // (webpack css-loader convention)
          { find: '~@shell', replacement: SHELL_ABS },
          { find: '~@rancher/icons', replacement: path.join(dir, 'node_modules/@rancher/icons') },
          { find: '@shell', replacement: SHELL_ABS },
          { find: '@components', replacement: COMPONENTS_DIR },
          { find: '~', replacement: dir },
          { find: '@', replacement: dir },
          // Some styles import css with an explicit node_modules/ prefix
          // (e.g. shell/components/FileDiff.vue), which webpack resolves natively
          { find: /^node_modules\//, replacement: `${ path.join(dir, 'node_modules') }/` },
          // Node polyfills (NodePolyfillPlugin equivalent) for the node builtins
          // used by browser code: Buffer (shell/utils/crypto) and https.Agent
          // (shell/plugins/axios.js, shell/plugins/steve/actions.js)
          { find: /^buffer$/, replacement: 'buffer/' },
          { find: /^https$/, replacement: path.join(SHELL_DIR, 'vite/node-https-shim.js') },
          { find: /^process$/, replacement: 'process/browser' },
        ],
        dedupe:     ['vue', 'vue-router', 'vuex'],
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      },

      // Equivalent of webpack's DefinePlugin (see createEnvVariablesPlugin in shell/vue.config.js)
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
        'process.client':                        'true',
        'process.server':                        'false',
        'process.browser':                       'true',
        global:                                  'globalThis',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      },

      css: {
        preprocessorOptions: {
          scss: {
            // This is effectively added to the beginning of each style that's imported or included in a vue file
            additionalData: `
              @use 'sass:math';
              @import "~shell/assets/styles/base/_variables.scss";
              @import "~shell/assets/styles/base/_functions.scss";
              @import "~shell/assets/styles/base/_mixins.scss";
            `,
            quietDeps:           true,
            silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'slash-div', 'legacy-js-api'],
          },
        },
      },

      server: {
        host:  '0.0.0.0',
        port:  devPorts ? 8005 : 80,
        https: {
          key:  fs.readFileSync(path.resolve(SHELL_DIR, 'server/server.key')),
          cert: fs.readFileSync(path.resolve(SHELL_DIR, 'server/server.crt')),
        },
        proxy: toViteProxy({ ...(appConfig.proxy || {}), ...getStandardProxies(api) }),
        watch: { ignored: ['**/dist-pkg/**', '**/scripts/standalone/**'] },
      },

      build: {
        outDir:                outputDir,
        sourcemap:             true,
        // The webpack build inlines css into the js chunks (css.extract: false),
        // so there is no per-chunk css request storm to match; a single
        // stylesheet keeps the request count comparable
        cssCodeSplit:          false,
        // The consolidated chunks below are intentionally large (webpack's are too)
        chunkSizeWarningLimit: 4096,
        rollupOptions:         {
          output: {
            codeSplitting: {
              groups: [
                // All models are preloaded before the app boots (see
                // model-loader-require.vite.js); one chunk means one request
                // instead of one per model
                { name: 'models', test: /[\\/]shell[\\/]models[\\/]/ },
                // Shell/component code shared between multiple lazy chunks would
                // otherwise be emitted as hundreds of tiny chunks, causing a
                // request storm on first load (webpack folds these into app.js).
                // Modules used by only one chunk keep their lazy boundary.
                {
                  name:          'shell-shared',
                  test:          /[\\/](shell|pkg[\\/]rancher-components)[\\/]/,
                  minShareCount: 2,
                },
                // Common runtime vendors shared across chunks; heavy lazily
                // loaded vendors (aws-sdk, xterm, codemirror etc.) are excluded
                // so they stay behind their dynamic imports
                {
                  name:          'vendor-shared',
                  test:          /[\\/]node_modules[\\/](?!@aws-sdk|@smithy|@xterm|codemirror|@novnc|jsrsasign|d3|d3-\w+|diff2html|jszip|xmlbuilder2)/,
                  minShareCount: 2,
                },
              ],
            },
          },
        },
      },

      optimizeDeps: { exclude: ['@rancher/dynamic', '@rancher/auto-import'] },

      // Serve a bundled app in dev (like webpack-dev-server) instead of
      // per-module requests. With ~3000 unbundled modules a reload makes the
      // browser re-fetch every one of them; Chromium also refuses to cache
      // responses from origins with self-signed certificates, which makes
      // unbundled reloads take 10s+.
      experimental: { bundledDev: true },
    };
  };
}
