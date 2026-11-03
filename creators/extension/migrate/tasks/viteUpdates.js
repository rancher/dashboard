/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const semver = require('semver');
const stats = require('../stats');
const { isDry, isSuggest } = require('../config');
const { writeContent, printContent } = require('../utils/content');

const SCRIPTS = [
  [/vue-cli-service serve\b/, 'vite'],
  [/vue-cli-service build\b/, 'vite build'],
];

const VUE_CLI_DEPENDENCIES = ['@vue/cli-plugin-babel', '@vue/cli-service', '@vue/cli-plugin-typescript'];

const APP_VUE_CONFIG = /^const config = require\('@rancher\/shell\/vue\.config'\);[^\n]*\n+module\.exports = config\(__dirname, \{\s*excludes: (\[[^\]]*\]),?\s*(\/\/[^\n]*\s*)?\}\);?\s*$/;
const PKG_VUE_CONFIG = /^module\.exports = require\('(\.\/\.shell|@rancher\/shell)\/pkg\/vue\.config(\.js)?'\)\(__dirname\);?\s*$/;
const PKG_BABEL_CONFIG = /^module\.exports = require\('(\.\/\.shell|@rancher\/shell)\/pkg\/babel\.config(\.js)?'\);?\s*$/;

const viteConfig = (excludes) => `import config from '@rancher/shell/vite.config.mjs';

export default config(import.meta.dirname, {
  excludes: ${ excludes },
  // excludes: ['fleet', 'example']
});
`;

function removeFile(file) {
  if (!isDry && !isSuggest) {
    fs.rmSync(file);
  }
  printContent(file, 'Removing');
  stats.vite.push(file);
  stats.total.push(file);
}

function updateJson(file, update) {
  const originalContent = fs.readFileSync(file, 'utf8');
  const json = JSON.parse(originalContent);
  const changes = update(json);

  if (changes.length) {
    writeContent(file, `${ JSON.stringify(json, null, 2) }\n`, originalContent);
    printContent(file, 'Updating for Vite', changes);
    stats.vite.push(file);
    stats.total.push(file);
  }
}

/**
 * Vite updates
 * Files: package.json, vue.config.js, vite.config.mjs, pkg/<name>/(package.json|tsconfig.json|vue.config.js|babel.config.js)
 *
 * The shell builds extensions with Vite rather than Vue CLI (webpack):
 * - the app's dev and build scripts run vite, and its vue.config.js becomes vite.config.mjs
 * - packages no longer need a vue.config.js, babel.config.js or the Vue CLI dependencies
 * - @rancher/shell is raised to `params.shellVersion` when it is older, since only a shell built with Vite runs them
 * Configuration that was customized is left in place, with a warning to move it to vite.config.mjs
 */
const viteUpdates = (params = {}) => {
  if (fs.existsSync('package.json')) {
    updateJson('package.json', (pkg) => {
      const changes = Object.keys(pkg.scripts || {}).reduce((out, name) => {
        const [from, to] = SCRIPTS.find(([re]) => re.test(pkg.scripts[name])) || [];

        if (from) {
          out.push([name, pkg.scripts[name]]);
          pkg.scripts[name] = pkg.scripts[name].replace(from, to);
        }

        return out;
      }, []);
      const shell = pkg.dependencies?.['@rancher/shell'];
      const current = semver.coerce(shell);
      const wanted = semver.coerce(params.shellVersion);

      if (current && wanted && semver.lt(current, wanted)) {
        changes.push(['@rancher/shell', shell]);
        pkg.dependencies['@rancher/shell'] = params.shellVersion;
      }

      return changes;
    });
  }

  if (fs.existsSync('vue.config.js')) {
    const content = fs.readFileSync('vue.config.js', 'utf8');
    const match = content.match(APP_VUE_CONFIG);

    if (!fs.existsSync('vite.config.mjs')) {
      writeContent('vite.config.mjs', viteConfig(match ? match[1] : '[]'), '');
      stats.vite.push('vite.config.mjs');
      stats.total.push('vite.config.mjs');
    }

    if (match) {
      removeFile('vue.config.js');
    } else {
      console.warn('vue.config.js has been customized and is no longer used: move its configuration to vite.config.mjs');
    }
  }

  const pkgFolder = 'pkg';

  if (!fs.existsSync(pkgFolder)) {
    return;
  }

  fs.readdirSync(pkgFolder).forEach((name) => {
    const dir = path.join(pkgFolder, name);
    const file = (fileName) => path.join(dir, fileName);

    if (fs.existsSync(file('package.json'))) {
      updateJson(file('package.json'), (pkg) => {
        const removed = VUE_CLI_DEPENDENCIES.filter((dependency) => pkg.devDependencies?.[dependency]);

        removed.forEach((dependency) => delete pkg.devDependencies[dependency]);

        if (removed.length && !Object.keys(pkg.devDependencies).length) {
          delete pkg.devDependencies;
        }

        return removed;
      });
    }

    if (fs.existsSync(file('tsconfig.json'))) {
      const originalContent = fs.readFileSync(file('tsconfig.json'), 'utf8');
      const content = originalContent.replace(/\s*"webpack-env",?/, '');

      if (content !== originalContent) {
        writeContent(file('tsconfig.json'), content, originalContent);
        printContent(file('tsconfig.json'), 'Removing webpack-env types');
        stats.vite.push(file('tsconfig.json'));
        stats.total.push(file('tsconfig.json'));
      }
    }

    [['vue.config.js', PKG_VUE_CONFIG], ['babel.config.js', PKG_BABEL_CONFIG]].forEach(([fileName, generated]) => {
      if (!fs.existsSync(file(fileName))) {
        return;
      }

      if (generated.test(fs.readFileSync(file(fileName), 'utf8'))) {
        removeFile(file(fileName));
      } else if (fileName === 'vue.config.js') {
        console.warn(`${ file(fileName) } has been customized and is no longer used: move its configuration to ${ file('vite.config.mjs') }`);
      }
    });
  });
};

module.exports = viteUpdates;
