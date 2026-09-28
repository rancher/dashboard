const fs = require('fs');
const path = require('path');
const contextFolders = ['chart', 'cloud-credential', 'content', 'detail', 'edit', 'list', 'machine-config', 'models', 'promptRemove', 'l10n', 'windowComponents', 'dialog', 'formatters', 'login'];
const contextMap = contextFolders.reduce((map, obj) => {
  map[obj] = true;

  return map;
}, {});

function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

// Injected at the top of every generated importTypes() function.
// Ensures both $extension (newer Rancher) and $plugin (older Rancher) are available on
// Vue globalProperties *and* on the Vuex root state, regardless of which one the host
// injected. This makes all extensions compatible across Rancher versions without any
// per-extension code changes.
const COMPAT_SHIM = `  if (typeof document !== 'undefined') {
    var patchGlobalProps = function() {
      var __el = document.getElementById('app');
      var __vueApp = __el && __el.__vue_app__;

      if (!__vueApp || !__vueApp.config || !__vueApp.config.globalProperties) {
        // no __vue_app__, vueApp.mount('#app') has not been called yet
        return false;
      }

      var __gp = __vueApp.config.globalProperties;

      // Components reach the extension manager through globalProperties (this.$extension).
      // Done first and unconditionally, so it still lands even if the store isn't ready yet.
      if (!__gp.$extension && __gp.$plugin) { __gp.$extension = __gp.$plugin; }
      else if (!__gp.$plugin && __gp.$extension) { __gp.$plugin = __gp.$extension; }

      // Models reach it through the Vuex root state instead - either via the '$extension'
      // accessor on the model base class, or directly as 'this.$rootState.$extension'.
      // Rancher versions before the rename only ever set '$plugin' there, so without this
      // an extension built against this shell resolves 'undefined' and either throws on
      // first use or silently does nothing.
      var __state = __gp.$store && __gp.$store.state;

      if (!__state) {
        return false;
      }

      // Only alias once the manager is actually populated. The store seeds both keys with
      // an empty object and swaps in the real manager later via the 'setPlugin' mutation,
      // so aliasing too early would permanently bind to the throwaway object.
      var __mgr = null;

      if (__state.$extension && __state.$extension.getPlugins) { __mgr = __state.$extension; }
      else if (__state.$plugin && __state.$plugin.getPlugins) { __mgr = __state.$plugin; }

      if (!__mgr) {
        return false;
      }

      __state.$extension = __mgr;
      __state.$plugin = __mgr;

      return true;
    };

    if (!patchGlobalProps()) {
      // Could not patch, keep retrying until it works
      var __retry = setInterval(function() {
        if (patchGlobalProps()) {
          clearInterval(__retry);
        }
      }, 100);

      // Fallback: clear interval after 10 seconds just in case
      setTimeout(function() { clearInterval(__retry); }, 10000);
    }
  }\n`;

function registerFile(file, type, pkg, f) {
  const importType = (f === 'models') ? 'require' : 'import';
  const chunkName = (f === 'l10n') ? '' : `/* webpackChunkName: "${ f }" */`;

  return `  $extension.register('${ f }', '${ type }', () => ${ importType }(${ chunkName }'${ pkg }/${ f }/${ file }'));\n`;
}

function register(file, pkg, f) {
  const name = file.replace(/\.[^/.]+$/, '');

  return registerFile(file, name, pkg, f);
}

// This function is used to generate the code to register models, edit, detail, list etc for a type
// This is used when building as a library - it does not use require.context - it scans the file system and build time.
// This ensures that the webpackChunkName is respected (require.context does not support this) - so when build as a library
// the code splitting will be respected
function generateTypeImport(pkg, dir) {
  let content = 'export function importTypes($extension) { \n';

  content += COMPAT_SHIM;

  // Auto-import if the folder exists
  contextFolders.forEach((f) => {
    const filePath = path.join(dir, f);

    if (fs.existsSync(filePath)) {
      fs.readdirSync(path.join(dir, f)).forEach((file) => {
        const fileStat = fs.lstatSync(path.join(filePath, file));

        // Directories are special cases
        if (fileStat.isDirectory()) {
          // This might be a <type>/index.vue (aka nested component)
          const indexFilePath = path.join(file, 'index.vue');
          const fullIndexFilePath = path.join(filePath, indexFilePath);

          if (fs.existsSync(fullIndexFilePath)) {
            content += registerFile(indexFilePath, file, pkg, f);

            return;
          }

          // This might be a <store name>/<model name|type>.js file (aka nested model)
          if (f === 'models') {
            fs.readdirSync(path.join(filePath, file)).forEach((store) => {
              content += register(path.join(file, store), pkg, f);
            });
          }
        } else {
          // This is a simple <resource type>.<file type> file
          content += register(file, pkg, f);
        }
      });
    }
  });

  content += `};\n`;

  return content;
}

// This function is used to generate the code to register models, edit, detail, list etc for a type
// This is used when building for dev when plugins are loaded into the app for development - it uses require.context - which ensures
// that any changes made will be picked up by hot module replacement. It will not respect code splitting, but this is okay
// for development. Also note the top-level folders are not watched, so if you don't have a 'list' folder (for example), you must create it
// and then restart the dev server for it to be picked up.
function generateDynamicTypeImport(pkg, dir) {
  const template = fs.readFileSync(path.join(__dirname, 'import.js'), { encoding: 'utf8' });
  let content = 'export function importTypes($extension) { \n';

  content += COMPAT_SHIM;

  // Auto-import if the folder exists
  contextFolders.forEach((f) => {
    if (fs.existsSync(path.join(dir, f))) {
      const safeName = f.replace(/\/|-/g, '_');
      let genImport = replaceAll(template, 'NAME', safeName);

      genImport = replaceAll(genImport, 'DIR', f );
      const importType = (f === 'models') ? 'require' : 'import';
      // Ensure i18n chunks are named with the request name (which will be the locale)
      const chunk = (f === 'l10n') ? '[request]' : f;
      let chunkName = `/* webpackChunkName: "${ chunk }" */ `;

      // Don't use chunk names with require
      if (importType === 'require') {
        chunkName = '';
      }

      const ext = (f === 'l10n') ? '.yaml' : '';

      genImport = replaceAll(genImport, 'BASE', pkg);
      genImport = replaceAll(genImport, 'CHUNK', chunkName);
      genImport = replaceAll(genImport, 'EXT', ext);
      content += replaceAll(genImport, 'REQUIRE', importType);
    }
  });

  content += `};\n`;

  return content;
}

module.exports = {
  contextFolders,
  contextMap,
  generateTypeImport,
  generateDynamicTypeImport,
  COMPAT_SHIM
};
