const fs = require('fs');
const path = require('path');

/**
 * Generates the virtual module '@rancher/dynamic' (also accessible as 'virtual:@rancher/dynamic').
 *
 * At build time, scans /pkg/ for packages with "rancher" in their package.json
 * and generates ESM code that registers them as built-in extensions.
 *
 * Also scans node_modules for npm-installed UI packages with the "rancher" property.
 *
 * Replaces webpack's VirtualModulesPlugin + getVirtualModules().
 */
function rancherDynamicPlugin(dir, includePkg) {
  const virtualModuleId = 'virtual:@rancher/dynamic';
  const resolvedVirtualModuleId = `\0${ virtualModuleId }`;

  function generateDynamicModule() {
    const imports = [];
    const registrations = [];
    let counter = 0;

    // Scan /pkg/ directory for built-in extensions
    const pkgFolder = path.join(dir, 'pkg');

    if (fs.existsSync(pkgFolder)) {
      const entries = fs.readdirSync(pkgFolder).filter((name) => !name.startsWith('.'));

      for (const name of entries) {
        const pkgJsonPath = path.join(pkgFolder, name, 'package.json');

        if (!fs.existsSync(pkgJsonPath)) {
          continue;
        }

        try {
          const library = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));

          if (includePkg(name) && library.rancher) {
            imports.push(`import pkg_${ counter } from '~/pkg/${ name }';`);
            registrations.push(`  $extension.registerBuiltinExtension('${ name }', { default: pkg_${ counter } });`);
            counter++;
          }
        } catch (e) {
          // Skip packages with invalid package.json
        }
      }
    }

    // Scan node_modules for npm-based UI packages
    const modulesPath = path.join(dir, 'node_modules');
    const rootPkgPath = path.join(dir, 'package.json');

    if (fs.existsSync(rootPkgPath)) {
      try {
        const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
        const deps = rootPkg.dependencies || {};

        for (const depName of Object.keys(deps)) {
          const depPkgPath = path.join(modulesPath, depName, 'package.json');

          if (!fs.existsSync(depPkgPath)) {
            continue;
          }

          try {
            const depPkg = JSON.parse(fs.readFileSync(depPkgPath, 'utf-8'));

            if (depPkg.rancher) {
              const id = `${ depPkg.name }-${ depPkg.version }`;
              const mainFile = depPkg.main || 'index.js';

              registrations.push(`  $extension.loadAsync('${ id }', '/pkg/${ id }/${ mainFile }');`);
            }
          } catch (e) {
            // Skip
          }
        }
      } catch (e) {
        // Skip
      }
    }

    return [
      imports.join('\n'),
      '',
      `export default function ($extension) {`,
      registrations.join('\n'),
      `};`,
    ].join('\n');
  }

  return {
    name:    'rancher-dynamic-modules',
    enforce: 'pre',

    resolveId(id) {
      if (id === '@rancher/dynamic' || id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
        return generateDynamicModule();
      }
    },
  };
}

module.exports = { rancherDynamicPlugin };
