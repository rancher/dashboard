const contextFolders = ['chart', 'cloud-credential', 'content', 'detail', 'edit', 'list', 'machine-config', 'models', 'promptRemove', 'l10n', 'windowComponents', 'dialog', 'formatters', 'login'];
const contextMap = contextFolders.reduce((map, obj) => {
  map[obj] = true;

  return map;
}, {});

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

module.exports = {
  contextFolders,
  contextMap,
  COMPAT_SHIM
};
