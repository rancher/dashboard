import { productsLoaded } from '@shell/store/type-map';
import { clearModelCache } from '@shell/plugins/dashboard-store/model-loader';
import { Plugin } from './plugin';
import { PluginRoutes } from './plugin-routes';

const MODEL_TYPE = 'models';

export default function({
  app,
  store,
  $axios,
  redirect
}, inject) {
  const dynamic = {};
  let _lastLoaded = 0;

  // Track which plugin loaded what, so we can unload stuff
  const plugins = {};

  const pluginRoutes = new PluginRoutes(app.router);

  inject('plugin', {
    // Plugins should not use these - but we will pass them in for now as a 2nd argument
    // in case there are use cases not covered that require direct access - we may remove access later
    internal() {
      const internal = {
        app,
        store,
        $axios,
        redirect,
        plugins: this
      };

      return internal;
    },

    // Load a plugin from a UI package
    loadAsync(id, mainFile) {
      return new Promise((resolve, reject) => {
        const moduleUrl = mainFile;
        const element = document.createElement('script');

        element.src = moduleUrl;
        element.type = 'text/javascript';
        element.async = true;

        element.onload = () => {
          element.parentElement.removeChild(element);

          if (!window[id]) {
            return reject(new Error('Could not load plugin code'));
          }

          // Update the timestamp that new plugins were loaded - may be needed
          // to update caches when new plugins are loaded
          _lastLoaded = new Date().getTime();

          // TODO: Error if we are loading a plugin already loaded?
          // name is the name of the plugin, including the version number
          const plugin = new Plugin(id);

          plugins[id] = plugin;

          // Initialize the plugin
          window[id].default(plugin, this.internal());

          // Uninstall existing plugin if there is one
          this.removePlugin(plugin.name);

          // Load all of the types etc from the plugin
          this.applyPlugin(plugin);

          // Add the plugin to the store
          store.dispatch('uiplugins/addPlugin', plugin);

          resolve();
        };

        element.onerror = (e) => {
          element.parentElement.removeChild(element);
          reject(e);
        };

        document.head.appendChild(element);
      });
    },

    // Used by the dynamic loader when a plugin is included in the build
    initPlugin(id, module) {
      const plugin = new Plugin(id);

      // Mark the plugin as being built-in
      plugin.builtin = true;

      plugins[id] = plugin;

      // Initialize the plugin
      const p = module;

      try {
        p.default(plugin, this.internal());

        // Uninstall existing product if there is one
        this.removePlugin(plugin.name);

        // Load all of the types etc from the plugin
        this.applyPlugin(plugin);

        // Add the plugin to the store
        store.dispatch('uiplugins/addPlugin', plugin);
      } catch (e) {
        console.error(`Error loading plugin ${ plugin.name }`); // eslint-disable-line no-console
        console.error(e); // eslint-disable-line no-console
      }
    },

    // Remove the plugin
    removePlugin(name) {
      const plugin = Object.values(plugins).find(p => p.name === name);

      if (!plugin) {
        return;
      }

      plugin.productNames.forEach((product) => {
        store.dispatch('type-map/removeProduct', { product, plugin });
      });

      // Remove all of the types
      Object.keys(plugin.types).forEach((typ) => {
        Object.keys(plugin.types[typ]).forEach((name) => {
          this.unregister(typ, name);

          if (typ === MODEL_TYPE) {
            clearModelCache(name);
          }
        });
      });

      // Remove locales
      plugin.locales.forEach((localeObj) => {
        store.dispatch('i18n/removeLocale', localeObj);
      });

      if (plugin.types.models) {
        // Ask the Steve stores to forget any data it has for models that we are removing
        this.removeTypeFromStore(store, 'rancher', Object.keys(plugin.types.models));
        this.removeTypeFromStore(store, 'management', Object.keys(plugin.types.models));
      }

      // Uninstall routes
      pluginRoutes.uninstall(plugin);

      // Call plugin uninstall hooks
      plugin.uninstallHooks.forEach(fn => fn(plugin, this.internal()));

      // Remove the plugin itself
      store.dispatch('uiplugins/removePlugin', name);

      // Unregister vuex stores
      plugin.stores.forEach(pStore => pStore.unregister(store));

      // Update last load since we removed a plugin
      _lastLoaded = new Date().getTime();
    },

    removeTypeFromStore(store, storeName, types) {
      (types || []).forEach((type) => {
        store.commit(`${ storeName }/forgetType`, type);
      });
    },

    // Apply the plugin based on its metadata
    applyPlugin(plugin) {
      // Types
      Object.keys(plugin.types).forEach((typ) => {
        Object.keys(plugin.types[typ]).forEach((name) => {
          this.register(typ, name, plugin.types[typ][name]);
        });
      });

      // l10n
      Object.keys(plugin.l10n).forEach((name) => {
        plugin.l10n[name].forEach((fn) => {
          this.register('l10n', name, fn);
        });
      });

      // Initialize the product if the store is ready
      if (productsLoaded()) {
        this.loadProducts([plugin]);
      }

      // Register vuex stores
      plugin.stores.forEach(pStore => pStore.register()(store));

      // Locales
      plugin.locales.forEach((localeObj) => {
        store.dispatch('i18n/addLocale', localeObj);
      });

      // Routes
      pluginRoutes.addRoutes(plugin, plugin.routes);
    },

    /**
     * Register 'something' that can be dynamically loaded - e.g. model, edit, create, list, i18n
     * @param {String} type type of thing to register, e.g. 'edit'
     * @param {String} name unique name of 'something'
     * @param {Function} fn function that dynamically loads the module for the thing being registered
     */
    register(type, name, fn) {
      if (!dynamic[type]) {
        dynamic[type] = {};
      }

      // Accumulate l10n resources rather than replace
      if (type === 'l10n') {
        if (!dynamic[type][name]) {
          dynamic[type][name] = [];
        }

        dynamic[type][name].push(fn);
      } else {
        dynamic[type][name] = fn;
      }
    },

    unregister(type, name, fn) {
      if (type === 'l10n') {
        if (dynamic[type]?.[name]) {
          const index = dynamic[type][name].find(func => func === fn);

          if (index !== -1) {
            dynamic[type][name].splice(index, 1);
          }
        }
      } else if (dynamic[type]?.[name]) {
        delete dynamic[type][name];
      }
    },

    // For debugging
    getAll() {
      return dynamic;
    },

    getPlugins() {
      return plugins;
    },

    getDynamic(typeName, name) {
      return dynamic[typeName]?.[name];
    },

    // Timestamp that a UI package was last loaded
    // Typically used to invalidate caches (e.g. i18n) when new plugins are loaded
    get lastLoad() {
      return _lastLoaded;
    },

    listDynamic(typeName) {
      if (!dynamic[typeName]) {
        return [];
      }

      return Object.keys(dynamic[typeName]);
    },

    // Get the products provided by plugins
    get products() {
      return dynamic.products || [];
    },

    // Load all of the products provided by plugins
    loadProducts(loadPlugins) {
      if (!loadPlugins) {
        loadPlugins = Object.values(plugins);
      }

      loadPlugins.forEach((plugin) => {
        if (plugin.products) {
          plugin.products.forEach(async(p) => {
            const impl = await p;

            if (impl.init) {
              impl.init(plugin, store);
            }
          });
        }
      });
    },
  });
}
