import './vite/env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';
import { searchForWorkspaceRoot } from 'vite';
import vue from '@vitejs/plugin-vue';
import { rancherIndexHtml } from './vite/index-html.mjs';
import { rancherDynamicModules } from './vite/dynamic-modules.mjs';
import { rancherLoaders } from './vite/loaders.mjs';
import { vueParenthesisedDefaultExport } from './vite/vue-compat.mjs';
import { rancherRequireCompat } from './vite/require-compat.mjs';
import { rancherDevServer } from './vite/dev-server.mjs';
import { rancherBundleReport } from './vite/bundle-report.mjs';
import { rancherShellDependencies } from './vite/shell-dependencies.mjs';
import { shellClassFields } from './vite/class-fields.mjs';
import vueConfigHelper from './vue-config-helper.js';

const require = createRequire(import.meta.url);
const {
  dev, devPorts, api, proxyWsOpts, proxyOpts, proxyMetaOpts, proxyPrimeOpts, toViteProxy
} = vueConfigHelper;

const SHELL_DIR = import.meta.dirname;
const shellPkgData = require('./package.json');

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
});

const getEnvVariables = (routerBasePath, rancherEnv) => ({
  'process.env.NODE_ENV':                  JSON.stringify(process.env.NODE_ENV),
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
  'process.env.UI_SHELL_RANCHER_VERSION':  JSON.stringify(shellPkgData.rancherVersion || ''),
  // Store the Router Base as env variable that we can use in `shell/config/router.js`
  'process.env.routerBase':                JSON.stringify(routerBasePath),
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
  global:                                  'globalThis',
});

const nodeGlobals = { transform: { inject: { Buffer: ['buffer', 'Buffer'] } } };

/**
 * Instrument code for code coverage in e2e tests
 */
const instrumentCode = async() => {
  // Only instrument when the environment variable is set
  if (process.env.TEST_INSTRUMENT !== 'true') {
    return [];
  }

  console.warn('Instrumenting code for coverage'); // eslint-disable-line no-console

  const { default: istanbul } = await import('vite-plugin-istanbul');

  return [istanbul({
    include:        ['shell/**', 'pkg/**'],
    exclude:        ['node_modules', '**/__tests__/**'],
    extension:      ['.js', '.vue', '.ts'],
    forceBuildInstrument: true,
  })];
};

const analyzeBundles = async(outputDir) => {
  if (process.env.ANALYZE !== 'true') {
    return [];
  }

  const { visualizer } = await import('rollup-plugin-visualizer');

  return [visualizer({ filename: path.join(outputDir, 'report.html'), template: 'treemap' })];
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

const assetFileNames = ({ names }) => {
  const ext = path.extname(names?.[0] || '').slice(1);

  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'avif'].includes(ext)) {
    return 'img/[name].[hash][extname]';
  }

  if (['woff', 'woff2', 'eot', 'ttf', 'otf'].includes(ext)) {
    return 'fonts/[name].[hash][extname]';
  }

  if (ext === 'css') {
    return 'css/[name].[hash][extname]';
  }

  return 'media/[name].[hash][extname]';
};

const assetsInlineLimit = (filePath, content) => !filePath.endsWith('.svg') && content.length < 8192;

/**
 * Expose a function that can be used by an app to provide the vite configuration for building an application.
 * This takes the directory of the application as the first argument so that we can derive folder locations
 * from it, rather than from the location of this file
 *
 * @param {string} dir the application's root directory
 * @param {{ excludes?: string[], proxy?: object }} appConfig `excludes` lists folders in `<dir>/pkg` that are not built
 * into the app, and `proxy` adds dev server proxies (keyed by path) to the ones for the Rancher API
 */
export default async function(dir, appConfig = {}) {
  EventEmitter.defaultMaxListeners = 20;

  const { SHELL_ABS, COMPONENTS_DIR } = getShellPaths(dir);
  const ICONS_DIR = path.dirname(require.resolve('@rancher/icons/package.json', { paths: [SHELL_ABS] }));
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

  return {
    root:      dir,
    base:      resourceBase || '/',
    publicDir: path.join(SHELL_ABS, 'static'),
    define:    getEnvVariables(routerBasePath, rancherEnv),
    oxc:       shellClassFields,

    resolve: {
      alias: [
        { find: '~shell', replacement: SHELL_ABS },
        { find: '@shell', replacement: SHELL_ABS },
        { find: '~@shell', replacement: SHELL_ABS },
        { find: '~assets', replacement: path.join(SHELL_DIR, 'assets') },
        { find: '@components', replacement: COMPONENTS_DIR },
        { find: '~@rancher/icons', replacement: ICONS_DIR },
        { find: /^(\.\/)?node_modules\//, replacement: `${ path.join(dir, 'node_modules') }/` },
        { find: /^~(?=[@\w])/, replacement: '' },
        { find: '~', replacement: dir },
        { find: '@', replacement: dir },
      ],
      dedupe:           ['vue', 'vue-router', 'vuex'],
      extensions:       ['.mjs', '.js', '.jsx', '.vue', '.json', '.tsx', '.ts', '.scss'],
      preserveSymlinks: true,
    },

    css: {
      preprocessorOptions: {
        scss: {
          // This is effectively added to the beginning of each style that's imported or included in a vue file. We may want to look into including these in app.scss
          additionalData: `
            @use 'sass:math';
            @import "~shell/assets/styles/base/_variables.scss";
            @import "~shell/assets/styles/base/_functions.scss";
            @import "~shell/assets/styles/base/_mixins.scss";
          `,
          charset:             false,
          silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
        },
      },
    },

    plugins: [
      vueParenthesisedDefaultExport(),
      vue({ template: { compilerOptions: { whitespace: 'preserve' } } }),
      rancherRequireCompat({ root: dir }),
      rancherIndexHtml({ root: dir, shellDir: SHELL_ABS }),
      rancherDynamicModules({ root: dir, includePkg }),
      rancherLoaders(),
      rancherDevServer({ api, shellRancherVersion: shellPkgData.rancherVersion }),
      rancherShellDependencies({ root: dir, shellDir: SHELL_ABS }),
      ...await instrumentCode(),
      ...await analyzeBundles(outputDir),
      ...(process.env.ANALYZE_LICENSES === 'true' ? [rancherBundleReport({ root: dir })] : []),
    ],

    optimizeDeps: {
      entries:         [path.join(SHELL_ABS, 'initialize', 'entry.js')],
      exclude:         ['@rancher/dynamic', '@rancher/auto-import'],
      rolldownOptions: nodeGlobals,
    },

    server: {
      host:         '0.0.0.0',
      port:         devPorts ? 8005 : 80,
      strictPort:   true,
      allowedHosts: true,
      https:        {
        key:  fs.readFileSync(path.join(SHELL_DIR, 'server', 'server.key')),
        cert: fs.readFileSync(path.join(SHELL_DIR, 'server', 'server.crt')),
      },
      proxy: toViteProxy(getProxyConfig(appConfig.proxy)),
      fs:    { allow: [searchForWorkspaceRoot(dir), ...[SHELL_ABS, COMPONENTS_DIR, ICONS_DIR].filter(fs.existsSync).map((folder) => fs.realpathSync(folder))] },
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/dist-pkg/**',
          '**/scripts/standalone/**',
          '**/.shell/**',
          ...excludes.map((excluded) => `**/pkg/${ excluded }/**`),
        ],
      },
    },

    preview: {
      port:       devPorts ? 8005 : 80,
      strictPort: true,
    },

    build: {
      outDir:      outputDir,
      emptyOutDir: true,
      sourcemap:   true,
      assetsInlineLimit,
      chunkSizeWarningLimit: 10000,
      rolldownOptions:       {
        ...nodeGlobals,
        output: {
          entryFileNames: 'js/[name].[hash].js',
          chunkFileNames: 'js/[name].[hash].js',
          assetFileNames,
        },
      },
    },
  };
}
