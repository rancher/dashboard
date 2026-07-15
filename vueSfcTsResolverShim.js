/**
 * A minimal, **TypeScript-free** adapter that satisfies the slice of the TS
 * compiler API that `@vue/compiler-sfc` uses to resolve types imported into
 * `defineProps<T>()` / `defineEmits<T>()` macros.
 *
 * Background: compiler-sfc resolves *relative* type imports itself (via `fs`), but
 * for *bare / path-aliased* imports (`@shell/...`, `@components/...`, `@pkg/...`)
 * it calls `resolveWithTS(...)`, which needs a `typescript` object. The native
 * TypeScript 7 package ships no JS API, so we hand compiler-sfc this shim instead
 * (via `compilerSfc.registerTS(() => shim)`). Alias resolution is delegated to
 * `get-tsconfig` (reads tsconfig `paths`/`baseUrl`, no TypeScript needed).
 *
 * Used by both the Jest `.vue` transformer and the webpack build.
 */
const fs = require('fs');
const path = require('path');
const { getTsconfig, createPathsMatcher } = require('get-tsconfig');

// Extensions compiler-sfc's own `resolveExt` tries; mirror them for bare imports.
const TRY_EXTS = ['.ts', '.tsx', '.d.ts', '.mts', '.d.mts', '.cts', '.d.cts', ''];

const readFileSafe = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : undefined);

const resolveExt = (base) => {
  for (const ext of TRY_EXTS) {
    const candidate = base + ext;

    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  for (const idx of ['index.ts', 'index.tsx', 'index.d.ts']) {
    const candidate = path.join(base, idx);

    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

// Cache the (tsconfig, pathsMatcher) per containing directory - compiler-sfc calls
// resolveModuleName once per aliased import across the whole type graph.
const matcherCache = new Map();

const getMatcher = (containingFile) => {
  const dir = path.dirname(containingFile);

  if (!matcherCache.has(dir)) {
    const tsconfig = getTsconfig(dir);

    matcherCache.set(dir, tsconfig ? createPathsMatcher(tsconfig) : null);
  }

  return matcherCache.get(dir);
};

module.exports = {
  // Used by compiler-sfc's resolveFS() as the fallback filesystem, and as the
  // parseConfigHost. `readFile` must return undefined (not throw) for missing files.
  sys: {
    useCaseSensitiveFileNames: true,
    fileExists:                (file) => fs.existsSync(file),
    readFile:                  readFileSafe,
    realpath:                  (file) => {
 try {
 return fs.realpathSync(file);
} catch {
 return file;
}
},
    directoryExists:           (dir) => fs.existsSync(dir) && fs.statSync(dir).isDirectory(),
  },

  // Only consulted by compiler-sfc for the `${configDir}` paths feature (>= 5.5).
  versionMajorMinor: '5.9',

  findConfigFile(searchPath, fileExists = fs.existsSync, configName = 'tsconfig.json') {
    let dir = fs.existsSync(searchPath) && fs.statSync(searchPath).isDirectory() ? searchPath : path.dirname(searchPath);

    for (;;) {
      const candidate = path.join(dir, configName);

      if (fileExists(candidate)) {
        return candidate;
      }
      const parent = path.dirname(dir);

      if (parent === dir) {
        return undefined;
      }
      dir = parent;
    }
  },

  // Real tsconfig parsing (extends/paths/baseUrl) is handled lazily by get-tsconfig
  // inside resolveModuleName; these two just need to return the shapes compiler-sfc
  // threads through to resolveModuleName.
  readConfigFile(configPath) {
    return { config: {} };
  },

  parseJsonConfigFileContent(_config, _host, _basePath, _existing, configPath) {
    return {
 options: { configFilePath: configPath }, raw: {}, projectReferences: undefined
};
  },

  createModuleResolutionCache() {
    return {};
  },

  resolveProjectReferencePath(ref) {
    return typeof ref === 'string' ? ref : ref?.path;
  },

  // The core: resolve a bare/aliased type-import specifier to a file on disk using
  // the tsconfig `paths` map. Returns the shape compiler-sfc reads (`resolvedModule
  // .resolvedFileName`), or an empty object when unresolved.
  resolveModuleName(source, containingFile) {
    const matcher = getMatcher(containingFile);

    if (matcher) {
      for (const base of matcher(source)) {
        const resolved = resolveExt(base);

        if (resolved) {
          return { resolvedModule: { resolvedFileName: resolved } };
        }
      }
    }

    // Fallback: bare node_modules type import (e.g. a package's own .d.ts).
    try {
      const pkgMain = require.resolve(source, { paths: [path.dirname(containingFile)] });
      const dts = pkgMain.replace(/\.[cm]?jsx?$/, '.d.ts');

      if (fs.existsSync(dts)) {
        return { resolvedModule: { resolvedFileName: dts } };
      }
    } catch {
      // ignore - unresolved
    }

    return {};
  },
};
