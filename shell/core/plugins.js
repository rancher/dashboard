import { productsLoaded } from '@shell/store/type-map';
import { clearModelCache } from '@shell/plugins/dashboard-store/model-loader';
import { EXT_IDS, Plugin } from './plugin';
import { PluginRoutes } from './plugin-routes';
import { UI_PLUGIN_BASE_URL } from '@shell/config/uiplugins';
import { ExtensionPoint } from './types';
import { addLinkInterceptor, removeLinkInterceptor } from '@shell/plugins/clean-html';

export default function(context, inject, vueApp) {
  const {
    app, store, $axios, redirect
  } = context;
  const dynamic = {};
  const validators = {};
  let _lastLoaded = 0;

  // Track which plugin loaded what, so we can unload stuff
  const plugins = {};

  const pluginRoutes = new PluginRoutes(app.router);

  const uiConfig = {};

  // Builtin extensions - these are registered when the UI loads and then initialized/loaded at the same time as the external extensions
  let builtin = [];

  for (const ep in ExtensionPoint) {
    uiConfig[ExtensionPoint[ep]] = {};
  }

  /**
   * When an extension adds a model extension, it provides the class - we will instantiate that class and store and use that
   */
  function instantiateModelExtension($plugin, clz) {
    const context = {
      dispatch: store.dispatch,
      getters:  store.getters,
      t:        store.getters['i18n/t'],
      $axios,
      $plugin,
    };

    return new clz(context);
  }

  inject(
    'plugin',
    {
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
      loadPluginAsync(plugin) {
        const { name, version } = plugin;
        const id = `${ name }-${ version }`;
        let url;

        if (plugin?.metadata?.direct === 'true') {
          url = plugin.endpoint;
        } else {
        // See if the plugin has a main metadata property set
          const main = plugin?.metadata?.main || `${ id }.umd.min.js`;

          url = `${ UI_PLUGIN_BASE_URL }/${ name }/${ version }/plugin/${ main }`;
        }

        return this.loadAsync(id, url);
      },

      // Load a plugin from a UI package
      loadAsync(id, mainFile) {
        return new Promise((resolve, reject) => {
        // The plugin is already loaded so we should avoid loading it again.
        // This will primarily affect plugins that load prior to authentication and we attempt to load again after authentication.
          if (document.getElementById(id)) {
            return resolve();
          }
          const moduleUrl = mainFile;
          const element = document.createElement('script');

          element.src = moduleUrl;
          element.type = 'text/javascript';
          element.async = true;
          element.id = id;
          element.dataset.purpose = 'extension';

          element.onload = () => {
            if (!window[id] || (typeof window[id].default !== 'function')) {
              return reject(new Error('Could not load plugin code'));
            }

            // Update the timestamp that new plugins were loaded - may be needed
            // to update caches when new plugins are loaded
            _lastLoaded = new Date().getTime();

            // name is the name of the plugin, including the version number
            const plugin = new Plugin(id);

            plugins[id] = plugin;

            // Initialize the plugin
            try {
              window[id].default(plugin, this.internal());
            } catch (e) {
              delete plugins[id];

              return reject(new Error('Could not initialize plugin'));
            }

            // Load all of the types etc from the plugin
            this.applyPlugin(plugin);

            // Add the plugin to the store
            store.dispatch('uiplugins/addPlugin', plugin);

            resolve();
          };

          element.onerror = (e) => {
            element.parentElement.removeChild(element);

            // Massage the error into something useful
            const errorMessage = `Failed to load script from '${ e.target.src }'`;

            console.error(errorMessage, e); // eslint-disable-line no-console
            reject(new Error(errorMessage)); // This is more useful where it's used
          };

          document.head.appendChild(element);
        });
      },

      /**
       * Load the builtin extensions by initializing them in turn
       */
      loadBuiltinExtensions() {
        builtin.forEach((ext) => {
          this.initBuiltinExtension(ext.id, ext.module);
        });

        // We've loaded the builtin extensions, so clear out the list so we don't load again
        builtin = [];
      },

      /**
       * Register a builtin extension that should be loaded
       *
       * Used by the dynamic loader when a plugin is included in the build (see shell/vue.config.js)
       */
      registerBuiltinExtension(id, module) {
        builtin.push({ id, module });
      },

      /**
       * Initialize a builtin extension
       *
       * This is only used by the 'loadBuiltinExtensions' function above
       */
      initBuiltinExtension(id, module) {
        const plugin = new Plugin(id);

        // Mark the plugin as being built-in
        plugin.builtin = true;

        plugins[id] = plugin;

        // Initialize the plugin
        const p = module;

        try {
          const load = p.default(plugin, this.internal());

          // The function must explicitly return false to skip loading of the extension (this is only allows on builtin extensions)
          // Only built-in extensions can return that they should not be loaded, because the extension can still do 'things'
          // in its init code (inject code, styles etc), so we do not want to hide an extension that has 'partially' loaded,
          // just because it tells us it should not load.
          // Built-in extensions are compiled into the app, so there is a level of trust assumed with them
          if (load !== false) {
            // Update last load so that the translations get loaded
            _lastLoaded = new Date().getTime();

            // Load all of the types etc from the extension
            this.applyPlugin(plugin);

            // Add the extension to the store
            store.dispatch('uiplugins/addPlugin', plugin);
          } else {
            // Plugin did not load, so remove it so it is not shown as loaded
            delete plugins[id];
          }
        } catch (e) {
          console.error(`Error loading extension ${ plugin.name }`); // eslint-disable-line no-console
          console.error(e); // eslint-disable-line no-console

          // Plugin did not load, so remove it so it is not shown as loaded
          delete plugins[id];
        }
      },

      async logout() {
        const all = Object.values(plugins);

        for (let i = 0; i < all.length; i++) {
          const plugin = all[i];

          if (plugin.builtin) {
            continue;
          }

          try {
            await this.removePlugin(plugin.name);
          } catch (e) {
            console.error('Error removing extension', e); // eslint-disable-line no-console
          }

          delete plugins[plugin.id];
        }
      },

      // Remove the plugin
      async removePlugin(name) {
        const plugin = Object.values(plugins).find((p) => p.name === name);

        if (!plugin) {
          return;
        }

        const promises = [];

        plugin.productNames.forEach((product) => {
          promises.push(store.dispatch('type-map/removeProduct', { product, plugin }));
        });

        // Remove all of the types
        Object.keys(plugin.types).forEach((typ) => {
          Object.keys(plugin.types[typ]).forEach((name) => {
            this.unregister(typ, name);

            if (typ === EXT_IDS.MODELS) {
              clearModelCache(name);
            }
          });
        });

        // Remove locales
        plugin.locales.forEach((localeObj) => {
          promises.push(store.dispatch('i18n/removeLocale', localeObj));
        });

        if (plugin.types.models) {
        // Ask the Steve stores to forget any data it has for models that we are removing
          promises.push(...this.removeTypeFromStore(store, 'rancher', Object.keys(plugin.types.models)));
          promises.push(...this.removeTypeFromStore(store, 'management', Object.keys(plugin.types.models)));
        }

        // Call plugin uninstall hooks
        plugin.uninstallHooks.forEach((fn) => fn(plugin, this.internal()));

        // Remove the plugin itself
        promises.push( store.dispatch('uiplugins/removePlugin', name));

        // Unregister vuex stores
        plugin.stores.forEach((pStore) => pStore.unregister(store));

        // Remove validators
        Object.keys(plugin.validators).forEach((key) => {
          delete validators[key];
        });

        // Remove link interceptors
        if (plugin.types.linkInterceptor) {
          Object.keys(plugin.types.linkInterceptor).forEach((name) => {
            removeLinkInterceptor(plugin.types.linkInterceptor[name]);
          });
        }

        await Promise.all(promises);

        // Update last load since we removed a plugin
        _lastLoaded = new Date().getTime();
      },

      removeTypeFromStore(store, storeName, types) {
        return (types || []).map((type) => store.commit(`${ storeName }/forgetType`, type));
      },

      // Apply the plugin based on its metadata
      applyPlugin(plugin) {
      // Types
        Object.keys(plugin.types).forEach((typ) => {
          Object.keys(plugin.types[typ]).forEach((name) => {
            this.register(typ, name, plugin.types[typ][name]);
          });
        });

        // UI Configuration - copy UI config from a plugin into the global uiConfig object
        Object.keys(plugin.uiConfig).forEach((actionType) => {
          Object.keys(plugin.uiConfig[actionType]).forEach((actionLocation) => {
            plugin.uiConfig[actionType][actionLocation].forEach((action) => {
              if (!uiConfig[actionType][actionLocation]) {
                uiConfig[actionType][actionLocation] = [];
              }
              uiConfig[actionType][actionLocation].push(action);
            });
          });
        });

        // l10n
        Object.keys(plugin.l10n).forEach((name) => {
          plugin.l10n[name].forEach((fn) => {
            this.register('l10n', name, fn);
          });
        });

        // Model extensions
        Object.keys(plugin.modelExtensions).forEach((name) => {
          plugin.modelExtensions[name].forEach((fn) => {
            this.register(EXT_IDS.MODEL_EXTENSION, name, instantiateModelExtension(this, fn));
          });
        });

        // Initialize the product if the store is ready
        if (productsLoaded()) {
          this.loadProducts([plugin]);
        }

        // Register vuex stores
        plugin.stores.forEach((pStore) => pStore.register()(store));

        // Locales
        plugin.locales.forEach((localeObj) => {
          store.dispatch('i18n/addLocale', localeObj);
        });

        // Routes
        pluginRoutes.addRoutes(plugin, plugin.routes);

        // Validators
        Object.keys(plugin.validators).forEach((key) => {
          validators[key] = plugin.validators[key];
        });

        // Link Interceptors
        if (dynamic.linkInterceptor) {
          Object.keys(dynamic.linkInterceptor).forEach((name) => {
            addLinkInterceptor(dynamic.linkInterceptor[name], name);
          });
        }
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

        // Accumulate l10n resources and model extensions rather than replace
        if (type === 'l10n' || type === EXT_IDS.MODEL_EXTENSION) {
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
            const index = dynamic[type][name].find((func) => func === fn);

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

      getValidator(name) {
        return validators[name];
      },

      /**
     * Return the UI configuration for the given type and location
     */
      getUIConfig(type, uiArea) {
        return uiConfig[type][uiArea] || [];
      },

      /**
     * Returns all UI Configuration (useful for debugging)
     */
      getAllUIConfig() {
        return uiConfig;
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
    },
    context,
    vueApp
  );
}
