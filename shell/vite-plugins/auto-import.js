const path = require('path');
const fs = require('fs');

const contextFolders = [
  'chart', 'cloud-credential', 'content', 'detail', 'edit', 'list',
  'machine-config', 'models', 'promptRemove', 'l10n', 'windowComponents',
  'dialog', 'formatters', 'login'
];

/**
 * Walk a directory and return file entries for auto-registration.
 */
function scanFolder(folderPath, folder) {
  const entries = [];

  if (!fs.existsSync(folderPath)) {
    return entries;
  }

  const items = fs.readdirSync(folderPath);

  for (const item of items) {
    const itemPath = path.join(folderPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // Check for index.vue (nested component)
      const indexVuePath = path.join(itemPath, 'index.vue');

      if (fs.existsSync(indexVuePath)) {
        entries.push({
          relativePath:     `${ item }/index.vue`,
          registrationName: item,
        });
        continue;
      }

      // For models, scan subdirectories (store-name/model-name pattern)
      if (folder === 'models') {
        const subItems = fs.readdirSync(itemPath);

        for (const subItem of subItems) {
          const subItemPath = path.join(itemPath, subItem);

          if (fs.statSync(subItemPath).isFile()) {
            const name = subItem.replace(/\.[^/.]+$/, '');

            entries.push({
              relativePath:     `${ item }/${ subItem }`,
              registrationName: `${ item }/${ name }`,
            });
          }
        }
      }
    } else {
      // Regular file
      const name = item.replace(/\.[^/.]+$/, '');

      entries.push({
        relativePath:     item,
        registrationName: name,
      });
    }
  }

  return entries;
}

/**
 * Generate auto-import module content for a package.
 * Produces ESM code with dynamic import() calls for most folders,
 * but uses eager static imports for 'models' since the model-loader
 * expects synchronous access (matching webpack's require() behavior).
 */
function generateAutoImportModule(pkgAlias, pkgDir) {
  const topLevelImports = [];
  // Map from "registrationName" → variable name for eager model imports
  const modelVarMap = {};
  let modelCounter = 0;

  // Pre-scan model files to generate eager (top-level) imports
  const modelsPath = path.join(pkgDir, 'models');
  const modelFiles = scanFolder(modelsPath, 'models');

  for (const file of modelFiles) {
    const varName = `__model_${ modelCounter++ }`;

    topLevelImports.push(`import * as ${ varName } from '${ pkgAlias }/models/${ file.relativePath }';`);
    modelVarMap[file.registrationName] = varName;
  }

  let content = topLevelImports.length ? `${ topLevelImports.join('\n') }\n\n` : '';

  content += 'export function importTypes($extension) {\n';

  for (const folder of contextFolders) {
    if (folder === 'models') {
      // Models must be registered as the module directly (not as a lazy
      // loader) because model-loader.js calls the value synchronously
      // and expects a module object, not a Promise.
      for (const file of modelFiles) {
        const varName = modelVarMap[file.registrationName];

        content += `  $extension.register('models', '${ file.registrationName }', ${ varName });\n`;
      }

      continue;
    }

    const folderPath = path.join(pkgDir, folder);
    const files = scanFolder(folderPath, folder);

    for (const file of files) {
      content += `  $extension.register('${ folder }', '${ file.registrationName }', `;
      content += `() => import('${ pkgAlias }/${ folder }/${ file.relativePath }'));\n`;
    }
  }

  content += '}\n';

  return content;
}

/**
 * Replaces both getAutoImport() and getVirtualModulesAutoImport() from webpack config.
 *
 * Resolves '@rancher/auto-import' to a package-specific virtual module based on
 * the importer's directory context. Generates registration code with dynamic import()
 * calls for each file found in convention-based folders.
 */
function rancherAutoImportPlugin(dir) {
  const prefix = '\0virtual:@rancher/auto-import/';
  let server;

  return {
    name:    'rancher-auto-import',
    enforce: 'pre',

    configureServer(s) {
      server = s;

      // Watch pkg directories for HMR
      const pkgDir = path.join(dir, 'pkg');

      if (fs.existsSync(pkgDir)) {
        const entries = fs.readdirSync(pkgDir).filter((n) => !n.startsWith('.'));

        for (const name of entries) {
          for (const folder of contextFolders) {
            const watchPath = path.join(pkgDir, name, folder);

            if (fs.existsSync(watchPath)) {
              s.watcher.add(watchPath);
            }
          }
        }
      }
    },

    handleHotUpdate({ file }) {
      // When files change in convention folders, invalidate the auto-import module
      const relative = path.relative(path.join(dir, 'pkg'), file);
      const parts = relative.split(path.sep);

      if (parts.length >= 2) {
        const pkgName = parts[0];
        const folder = parts[1];

        if (contextFolders.includes(folder)) {
          const mod = server?.moduleGraph.getModuleById(`${ prefix }${ pkgName }`);

          if (mod) {
            server?.moduleGraph.invalidateModule(mod);

            return [];
          }
        }
      }
    },

    resolveId(source, importer) {
      if (source === '@rancher/auto-import') {
        if (!importer) {
          return null;
        }

        // Determine which package is importing
        const normalized = importer.split(path.sep).join('/');
        const parts = normalized.split('/');
        const pkgIndex = parts.findIndex((s) => s === 'pkg');

        if (pkgIndex !== -1 && (pkgIndex + 1) < parts.length) {
          const pkg = parts[pkgIndex + 1];

          return `${ prefix }${ pkg }`;
        }

        return null;
      }

      if (source.startsWith('@rancher/auto-import/')) {
        const pkg = source.substring('@rancher/auto-import/'.length);

        return `${ prefix }${ pkg }`;
      }

      return null;
    },

    load(id) {
      if (id.startsWith(prefix)) {
        const pkg = id.substring(prefix.length);
        const pkgDir = path.join(dir, 'pkg', pkg);
        const pkgAlias = `@pkg/${ pkg }`;

        return generateAutoImportModule(pkgAlias, pkgDir);
      }
    },
  };
}

module.exports = { rancherAutoImportPlugin };
