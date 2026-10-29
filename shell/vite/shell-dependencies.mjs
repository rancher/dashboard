import fs from 'node:fs';
import path from 'node:path';

const SOURCE = /\.(js|mjs|ts|vue)$/;
const NOT_SOURCE = /\.(test|spec)\.[jt]s$|\.d\.ts$/;
const NOT_BROWSER = new Set(['__tests__', 'unit-tests', 'node_modules', 'pkg', 'scripts', 'server', 'types', 'vite']);
const IMPORT = /(?:^|[^.\w$])(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|(?:^|[^.\w$])import\s*\(\s*['"]([^'"]+)['"]\s*\)|(?:^|[^.\w$])import\s+['"]([^'"]+)['"]/g;
const LOCAL = /^(\.|\/|~|@\/|@shell\/|@components\/|@pkg\/|@rancher\/(shell|dynamic|auto-import)\b|virtual:)/;

const packageName = (id) => id.split('/').slice(0, id.startsWith('@') ? 2 : 1).join('/');

/**
 * The packages that the shell's browser code imports, other than itself, that are installed in the app
 *
 * @param {string} shellDir the shell's folder
 * @param {string} root the app's root directory
 * @returns {string[]}
 */
export function shellDependencies(shellDir, root) {
  const ids = new Set();

  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const file = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!NOT_BROWSER.has(entry.name)) {
        walk(file);
      }
    } else if (SOURCE.test(entry.name) && !NOT_SOURCE.test(entry.name)) {
      for (const match of fs.readFileSync(file, 'utf8').matchAll(IMPORT)) {
        ids.add((match[1] || match[2] || match[3]).split('?')[0]);
      }
    }
  });

  const browserFolders = fs.readdirSync(shellDir, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !NOT_BROWSER.has(entry.name));

  browserFolders.forEach((entry) => walk(path.join(shellDir, entry.name)));

  return [...ids]
    .filter((id) => !LOCAL.test(id) && !id.startsWith('node:') && !/\.(s?css|svg|png)$/.test(id) && fs.existsSync(path.join(root, 'node_modules', packageName(id))))
    .sort();
}

/**
 * When the shell is installed in the app's node_modules (an extension's app), serve the shell as source rather than
 * pre-bundling it as a dependency, and pre-bundle the packages it imports, which vite would otherwise only find in
 * the app's own code
 *
 * @param {{ root: string, shellDir: string }} options the app's root directory and the shell's folder
 */
export function rancherShellDependencies({ root, shellDir }) {
  return {
    name:  'rancher:shell-dependencies',
    apply: 'serve',

    config() {
      if (!path.relative(path.join(root, 'node_modules'), shellDir).startsWith('@rancher')) {
        return;
      }

      return {
        optimizeDeps: {
          include: shellDependencies(shellDir, root),
          exclude: ['@rancher/shell', '@shell', '~shell', '@components'],
        },
      };
    },
  };
}
