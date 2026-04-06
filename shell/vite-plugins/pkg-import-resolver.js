const path = require('path');
const fs = require('fs');

/**
 * Resolves @pkg imports relative to the importing package's own directory.
 *
 * When a file in /pkg/eks/ imports '@pkg/something', this resolves it
 * to /pkg/eks/something. When it imports '@pkg/eks/something', it resolves
 * to /pkg/eks/something as well.
 *
 * Replaces the webpack NormalModuleReplacementPlugin for @pkg.
 */
function pkgImportResolver(dir) {
  const extensions = ['.ts', '.js', '.vue', '.tsx', '.jsx', '.json', '.scss', '.css'];

  function tryResolve(filePath) {
    // Direct file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }

    // Try with extensions
    for (const ext of extensions) {
      const withExt = filePath + ext;

      if (fs.existsSync(withExt)) {
        return withExt;
      }
    }

    // Try as directory with index file
    for (const ext of extensions) {
      const indexPath = path.join(filePath, `index${ ext }`);

      if (fs.existsSync(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }

  return {
    name:    'rancher-pkg-import-resolver',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!source.startsWith('@pkg/') && !source.startsWith('@pkg\\')) {
        return null;
      }
      if (!importer) {
        return null;
      }

      const ctx = importer.split(path.sep).join('/').split('/');
      const pkgIndex = ctx.findIndex((s) => s === 'pkg');

      if (pkgIndex !== -1 && (pkgIndex + 1) < ctx.length) {
        const pkg = ctx[pkgIndex + 1];
        const remainder = source.substring(5); // strip '@pkg/'

        let resolved;

        // If the import already starts with the package name, resolve relative to pkg dir
        if (remainder.startsWith(`${ pkg }/`) || remainder === pkg) {
          resolved = path.resolve(dir, 'pkg', remainder);
        } else {
          // Otherwise resolve relative to the importing package
          resolved = path.resolve(dir, 'pkg', pkg, remainder);
        }

        const result = tryResolve(resolved);

        if (result) {
          return result;
        }

        // Return the resolved path anyway — Vite will report a proper error
        return resolved;
      }

      return null;
    }
  };
}

module.exports = { pkgImportResolver };
