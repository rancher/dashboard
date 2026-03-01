const fs = require('fs');
const path = require('path');
const { defineConfig } = require('vite');
const vue = require('@vitejs/plugin-vue');
const { nodePolyfills } = require('vite-plugin-node-polyfills');
const { yamlPlugin } = require('../vite-plugins/yaml-loader');
const { markdownPlugin } = require('../vite-plugins/markdown-loader');
const { generateTypeImport } = require('./auto-import');

/**
 * Read tsconfig.json paths from the extension's root and convert them to
 * Vite-compatible resolve aliases.  This allows extensions that define custom
 * path aliases (e.g. @kubewarden/* -> pkg/kubewarden/*) to build without a
 * dedicated vite.config.js.
 */
function readTsconfigAliases(appDir, pkgDir) {
  for (const candidate of [
    path.join(appDir, 'tsconfig.json'),
    path.join(pkgDir, 'tsconfig.json'),
  ]) {
    if (!fs.existsSync(candidate)) {
      continue;
    }
    try {
      // Strip comments (single-line only) for JSON.parse compatibility
      const raw = fs.readFileSync(candidate, 'utf8').replace(/\/\/.*/g, '');
      const tsconfig = JSON.parse(raw);
      const paths = tsconfig?.compilerOptions?.paths;

      if (!paths) {
        continue;
      }
      const baseUrl = tsconfig.compilerOptions.baseUrl || '.';
      const base = path.resolve(path.dirname(candidate), baseUrl);
      const aliases = {};

      for (const [pattern, targets] of Object.entries(paths)) {
        if (!targets?.length) {
          continue;
        }
        // Convert tsconfig glob pattern to a simple prefix alias.
        // e.g. "@kubewarden/*" -> ["./pkg/kubewarden/*"]
        const key = pattern.replace(/\/\*$/, '');
        const value = path.resolve(base, targets[0].replace(/\/\*$/, ''));

        // Skip aliases we already handle
        if (['~', '@', '@shell', '~shell', '@components', '@pkg', '~pkg'].includes(key)) {
          continue;
        }
        aliases[key] = value;
      }

      return aliases;
    } catch (e) {
      // Ignore parse errors — tsconfig may use features we can't parse
    }
  }

  return {};
}

/**
 * Create Vite configuration for building a Rancher extension as an ESM library.
 *
 * Replaces shell/pkg/vue.config.js which used vue-cli-service build --target lib.
 *
 * @param dir - The root directory of the extension package (e.g. /workspace/dashboard/pkg/eks)
 */
function createPkgViteConfig(dir) {
  const maindir = path.resolve(dir, '..', '..');
  const pkgName = path.basename(dir);

  // The shell code must be sym-linked into the .shell folder
  let SHELL = path.join(dir, '.shell');
  let COMPONENTS_DIR = path.join(SHELL, 'rancher-components');

  if (fs.existsSync(SHELL)) {
    const stat = fs.lstatSync(SHELL);

    if (stat.isSymbolicLink() && !fs.existsSync(COMPONENTS_DIR)) {
      const REAL_SHELL = fs.realpathSync(SHELL);

      COMPONENTS_DIR = path.join(REAL_SHELL, '..', 'pkg', 'rancher-components', 'src', 'components');
    }
  }

  if (fs.existsSync(path.join(maindir, 'shell'))) {
    SHELL = path.join(maindir, 'shell');
    COMPONENTS_DIR = path.join(maindir, 'pkg', 'rancher-components', 'src', 'components');
  }

  // Determine entry file
  const entryFile = fs.existsSync(path.join(dir, 'index.ts')) ? 'index.ts' : 'index.js';

  // Generate auto-import virtual module content
  const autoImportContent = generateTypeImport('@pkg', dir);

  // Read extension-specific path aliases from tsconfig.json so that extensions
  // with custom aliases (e.g. @kubewarden/*) work without a vite.config.js.
  const tsconfigAliases = readTsconfigAliases(maindir, dir);

  // Resolve @vue/compiler-sfc explicitly to avoid picking up a mismatched
  // nested copy (e.g. vue/node_modules/@vue/compiler-sfc@3.2.x when the
  // hoisted @vue/compiler-sfc is 3.5.x).
  let compiler;

  try {
    compiler = require(require.resolve('@vue/compiler-sfc', { paths: [maindir, dir] }));
  } catch {
    // Fall back to the default resolution in @vitejs/plugin-vue
  }

  return defineConfig({
    plugins: [
      // Normalize `export default ({...});` to `export default {...}` in Vue SFCs.
      // The parenthesised form is valid JS but @vitejs/plugin-vue fails to inject
      // the render function correctly when it encounters it.  Webpack/vue-loader
      // handled both forms, so this shim keeps old extensions building.
      {
        name:    'rancher-vue-export-compat',
        enforce: 'pre',
        transform(code, id) {
          if (!id.endsWith('.vue')) {
            return null;
          }
          // Only rewrite when the pattern appears in a <script> block
          const replaced = code.replace(
            /export\s+default\s+\(\{/g,
            'export default {'
          );

          if (replaced !== code) {
            // Also fix the matching closing `});` → `}`
            // We target `});` that appears before </script> to avoid touching template/style
            const fixed = replaced.replace(/\}\);(\s*<\/script>)/g, '}$1');

            return { code: fixed, map: null };
          }

          return null;
        },
      },

      vue.default(compiler ? { compiler } : {}),

      // Auto-import virtual module for this specific package
      {
        name:    'rancher-pkg-auto-import',
        enforce: 'pre',
        resolveId(source) {
          if (source === '@rancher/auto-import') {
            return '\0virtual:@rancher/auto-import';
          }
        },
        load(id) {
          if (id === '\0virtual:@rancher/auto-import') {
            return autoImportContent;
          }
        },
      },

      // Replace dynamic-importer with lib version (no-op for packages)
      {
        name:    'rancher-dynamic-importer-override',
        enforce: 'pre',
        resolveId(source) {
          if (/dynamic-importer$/.test(source)) {
            return path.join(__dirname, 'dynamic-importer.lib.js');
          }
          if (/model-loader-require$/.test(source)) {
            const pkgOverride = path.join(dir, 'model-loader-require.lib.js');

            return fs.existsSync(pkgOverride) ? pkgOverride : path.join(__dirname, 'model-loader-require.lib.js');
          }
        },
      },

      yamlPlugin(),
      markdownPlugin(),

      nodePolyfills(),
    ],

    resolve: {
      alias: {
        ...tsconfigAliases,
        '@shell':              SHELL,
        '~shell':              SHELL,
        '@components':         COMPONENTS_DIR,
        './node_modules':      path.join(maindir, 'node_modules'),
        [`@pkg/${ pkgName }`]: dir,
        '@pkg':                dir,
        '~pkg':                dir,
        '~':                   maindir,
      },
      extensions: ['.tsx', '.ts', '.js', '.vue', '.scss', '.json'],
    },

    css: {
      extract:             false,
      preprocessorOptions: { scss: { additionalData: `@use 'sass:math'; @import "${ SHELL }/assets/styles/base/_variables.scss"; @import "${ SHELL }/assets/styles/base/_functions.scss"; @import "${ SHELL }/assets/styles/base/_mixins.scss"; ` } }
    },

    build: {
      lib: {
        entry:    path.resolve(dir, entryFile),
        name:     pkgName,
        formats:  ['es'],
        fileName: () => `${ pkgName }.es.js`,
      },
      sourcemap:     true,
      rollupOptions: {
        // These modules will be externalised and not included with the build
        // They must be provided by the hosting application
        external: [
          'vue',
          'jquery',
          'jszip',
          'js-yaml',
          /^@shell\//,
          /^~shell\//,
          /^@rancher\/components/,
          /^@components\//,
        ],
        output: {
          globals: {
            vue:       'Vue',
            jquery:    '$',
            jszip:     '__jszip',
            'js-yaml': '__jsyaml',
          },
        },
      },
    },
  });
}

// Default export: when Vite loads this file directly via --config, it calls the
// default export with { mode, command } instead of a dir string. In that case,
// fall back to process.cwd() which build-pkg.sh sets to the package directory.
function viteConfigDefault(dirOrViteEnv) {
  const dir = typeof dirOrViteEnv === 'string' ? dirOrViteEnv : process.cwd();

  return createPkgViteConfig(dir);
}

module.exports = viteConfigDefault;
module.exports.createPkgViteConfig = createPkgViteConfig;
