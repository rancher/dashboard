import fs from 'node:fs';
import path from 'node:path';
import { contextFolders, COMPAT_SHIM } from '../pkg/auto-import.js';

const DYNAMIC = '@rancher/dynamic';
const AUTO_IMPORT = '@rancher/auto-import';
const RESOLVED_DYNAMIC = `\0${ DYNAMIC }`;
const RESOLVED_AUTO_IMPORT = `\0${ AUTO_IMPORT }:`;

const TYPE_GLOBS = ['**/*.{vue,js,jsx,ts,tsx,yaml,yml}', '!**/__tests__/**', '!**/*.{test,spec}.{js,ts}', '!**/*.d.ts'];

const cleanId = (id) => id.split('?')[0];
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const isWithin = (dir, file) => {
  const rel = path.relative(dir, file);

  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel);
};

export function dynamicModule(root, includePkg) {
  const imports = [];
  const calls = [];
  const pkgFolder = path.join(root, 'pkg');

  if (fs.existsSync(pkgFolder)) {
    fs.readdirSync(pkgFolder)
      .filter((name) => !name.startsWith('.')) // Ignore hidden folders
      .forEach((name) => {
        const pkgFile = path.join(pkgFolder, name, 'package.json');
        const library = fs.existsSync(pkgFile) ? readJson(pkgFile) : {};

        // Package file must have rancher field to be a plugin
        if (includePkg(name) && library.rancher) {
          imports.push(`import * as builtin${ imports.length } from ${ JSON.stringify(path.join(pkgFolder, name)) };`);
          calls.push(`$extension.registerBuiltinExtension(${ JSON.stringify(name) }, builtin${ imports.length - 1 });`);
        }
      });
  }

  // Find any UI packages in node_modules
  const requiredPackages = readJson(path.join(root, 'package.json'));

  Object.keys(requiredPackages.dependencies || {}).forEach((requiredPackage) => {
    const library = readJson(path.join(root, 'node_modules', requiredPackage, 'package.json'));

    // The package.json must have the 'rancher' property to mark it as a UI package
    if (library.rancher) {
      const id = `${ library.name }-${ library.version }`;

      calls.push(`$extension.loadAsync(${ JSON.stringify(id) }, ${ JSON.stringify(`/pkg/${ id }/${ library.main }`) });`);
    }
  });

  return `${ imports.join('\n') }\nexport default function($extension) {\n  ${ calls.join('\n  ') }\n}\n`;
}

export function autoImportModule(pkgDir, root) {
  const base = path.posix.join('/', path.relative(root, pkgDir).split(path.sep).join('/'));
  const folders = contextFolders.map((folder) => {
    const prefix = path.posix.join(base, folder, '/');
    const globs = TYPE_GLOBS.map((glob) => (glob.startsWith('!') ? glob : `${ prefix }${ glob }`));

    return `  register(${ JSON.stringify(folder) }, ${ prefix.length }, import.meta.glob(${ JSON.stringify(globs) }${ folder === 'models' ? ', { eager: true }' : '' }));`;
  });

  return `export function importTypes($extension) {\n${ COMPAT_SHIM }  const register = (type, prefix, modules) => Object.entries(modules).forEach(([file, mod]) => {\n    $extension.register(type, file.slice(prefix).replace(/\\.\\w+$/, ''), type === 'models' ? () => mod : mod);\n  });\n${ folders.join('\n') }\n}\n`;
}

/**
 * The modules that webpack used to generate for an app: '@rancher/dynamic' (the extensions built into the app),
 * '@rancher/auto-import' (the types of the package that imports it), and '@pkg' imports, which resolve to the root
 * of the package that imports them
 *
 * @param {{ root: string, includePkg: (name: string) => boolean }} options the app's root directory, and which of the
 * folders in its pkg folder are built into the app
 */
export function rancherDynamicModules({ root, includePkg }) {
  const pkgFolder = path.join(root, 'pkg');

  const packageOf = (importer) => {
    const file = cleanId(importer);

    return isWithin(pkgFolder, file) ? path.join(pkgFolder, path.relative(pkgFolder, file).split(path.sep)[0]) : path.dirname(file);
  };

  return {
    name:    'rancher:dynamic-modules',
    enforce: 'pre',

    resolveId(source, importer) {
      if (source === DYNAMIC) {
        return RESOLVED_DYNAMIC;
      }

      if (source === AUTO_IMPORT && importer) {
        return `${ RESOLVED_AUTO_IMPORT }${ packageOf(importer) }`;
      }

      if (source === '@pkg' || source.startsWith('@pkg/')) {
        const request = source.slice(5);
        let target = path.join(pkgFolder, request);

        if (importer && isWithin(pkgFolder, cleanId(importer))) {
          const pkg = path.basename(packageOf(importer));

          if (request !== pkg && !request.startsWith(`${ pkg }/`)) {
            target = path.join(pkgFolder, pkg, request);
          }
        }

        return this.resolve(target, importer, { skipSelf: true });
      }
    },

    load(id) {
      if (id === RESOLVED_DYNAMIC) {
        return dynamicModule(root, includePkg);
      }

      if (id.startsWith(RESOLVED_AUTO_IMPORT)) {
        return autoImportModule(id.slice(RESOLVED_AUTO_IMPORT.length), this.environment.config.root);
      }
    },
  };
}
