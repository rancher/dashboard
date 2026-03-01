const path = require('path');
const fs = require('fs');

/**
 * Generates the virtual module '@rancher/dynamic-importer-modules'.
 *
 * Scans shell directories (list, edit, detail, chart, etc.) at build time
 * and produces a module that exports pre-filtered lazy-import maps, excluding
 * test files (__tests__/, *.test.*, *.spec.*).
 *
 * This replaces the inline import.meta.glob() calls that were previously in
 * shell/utils/dynamic-importer.js, centralising the test-file exclusion logic
 * and keeping the consumer clean.
 */

const MODULE_ID = '@rancher/dynamic-importer-modules';
const RESOLVED_ID = `\0virtual:${ MODULE_ID }`;

/**
 * Directory definitions that mirror the glob patterns previously in dynamic-importer.js.
 *
 * Each entry produces a named export whose keys are "/shell/<subdir>/<file>"
 * and whose values are `() => import("@shell/<subdir>/<file>")`.
 */
const SCAN_DEFS = [
  { name: 'listModules', subdir: 'list' },
  { name: 'chartModules', subdir: 'chart' },
  { name: 'editModules', subdir: 'edit' },
  { name: 'detailModules', subdir: 'detail' },
  { name: 'windowModules', subdir: 'components/Window' },
  { name: 'machineConfigModules', subdir: 'machine-config' },
  { name: 'cloudCredentialModules', subdir: 'cloud-credential' },
  { name: 'promptRemoveModules', subdir: 'promptRemove' },
  {
    name: 'productModules', subdir: 'config/product', recursive: false,
  },
  { name: 'loginModules', subdir: 'components/auth/login' },
  { name: 'dialogModules', subdir: 'dialog' },
  { name: 'drawerModules', subdir: 'components/Drawer' },
  {
    name: 'translationModules', subdir: 'assets/translations', recursive: false, extensions: ['.yaml'],
  },
];

// ---- helpers ----------------------------------------------------------------

function isTestFile(filePath) {
  const parts = filePath.split(path.sep);

  if (parts.includes('__tests__')) {
    return true;
  }

  const base = path.basename(filePath);

  return /\.(test|spec)\.[jt]sx?$/.test(base);
}

/**
 * Walk `dir` and return relative POSIX paths for every file that passes the
 * test-file filter and optional extension filter.
 *
 * @param {string} dir       - Current directory being scanned
 * @param {boolean} recursive - Whether to recurse into subdirectories
 * @param {string[]|null} extensions - Optional extension filter (e.g. ['.yaml'])
 * @param {string} rootDir   - The top-level scan directory (used for path.relative)
 */
function scanDir(dir, recursive = true, extensions = null, rootDir = dir) {
  const results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__' || entry.name === 'node_modules') {
      continue;
    }

    const full = path.join(dir, entry.name);

    if (entry.isDirectory() && recursive) {
      results.push(...scanDir(full, true, extensions, rootDir));
    } else if (entry.isFile() && !isTestFile(full)) {
      if (extensions && !extensions.includes(path.extname(entry.name))) {
        continue;
      }

      const rel = path.relative(rootDir, full).split(path.sep).join('/');

      results.push(rel);
    }
  }

  return results;
}

// ---- code generation --------------------------------------------------------

function generateModule(shellDir) {
  const parts = [];

  for (const def of SCAN_DEFS) {
    const dir = path.join(shellDir, def.subdir);
    const files = scanDir(dir, def.recursive !== false, def.extensions || null);

    parts.push(`export const ${ def.name } = {`);

    for (const rel of files) {
      const key = `/shell/${ def.subdir }/${ rel }`;
      const importPath = `@shell/${ def.subdir }/${ rel }`;

      parts.push(`  ${ JSON.stringify(key) }: () => import(${ JSON.stringify(importPath) }),`);
    }

    parts.push('};\n');
  }

  return parts.join('\n');
}

// ---- plugin -----------------------------------------------------------------

function dynamicImporterModulesPlugin(shellDir) {
  let server;

  return {
    name:    'rancher-dynamic-importer-modules',
    enforce: 'pre',

    configureServer(s) {
      server = s;

      // Watch the scanned directories for HMR
      for (const def of SCAN_DEFS) {
        const dir = path.join(shellDir, def.subdir);

        if (fs.existsSync(dir)) {
          s.watcher.add(dir);
        }
      }
    },

    handleHotUpdate({ file }) {
      // If a file in one of the scanned directories changes, invalidate the virtual module
      for (const def of SCAN_DEFS) {
        const dir = path.join(shellDir, def.subdir);
        const relative = path.relative(dir, file);

        if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
          const mod = server?.moduleGraph.getModuleById(RESOLVED_ID);

          if (mod) {
            server?.moduleGraph.invalidateModule(mod);

            return [];
          }
        }
      }
    },

    resolveId(id) {
      if (id === MODULE_ID) {
        return RESOLVED_ID;
      }
    },

    load(id) {
      if (id === RESOLVED_ID) {
        return generateModule(shellDir);
      }
    },
  };
}

module.exports = { dynamicImporterModulesPlugin };
