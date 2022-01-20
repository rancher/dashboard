import { DSL, productsLoaded } from '@shell/store/type-map';

export default function({
  app,
  store,
  $axios,
  redirect
}, inject) {
  const dynamic = {};
  let _lastLoaded = 0;

  inject('extension', {

    DSL,

    // Load a plugin from a UI package
    loadAsync(name, mainFile) {
      return new Promise((resolve, reject) => {
        const router = app.router;
        const moduleUrl = mainFile;
        const element = document.createElement('script');

        element.src = moduleUrl;
        element.type = 'text/javascript';
        element.async = true;

        element.onload = () => {
          element.parentElement.removeChild(element);

          if (!window[name]) {
            return reject(new Error('Could not load plugin code'));
          }

          // Update the timestamp that new plugins were loaded - may be needed
          // to update caches when new plugins are loaded
          _lastLoaded = new Date().getTime();

          // Initialize the plugin
          window[name].default(router, store, this);
          resolve();
        };

        element.onerror = (e) => {
          element.parentElement.removeChild(element);
          reject(e);
        };

        document.head.appendChild(element);
      });
    },

    /**
     * Register 'something' that can be dynamically loaded - e.g. model, edit, create, list, i18n
     * @param {String} type type of thing to register, e.g. 'edit'
     * @param {String} name type of thing to register, e.g. 'edit'
     * @param {Function} fn function that dynamically loads the module for the thing being registered
     */
    register(type, name, fn) {
      if (!dynamic[type]) {
        dynamic[type] = {};
      }

      // Accumulate i18n resources rather than replace
      if (type === 'i18n') {
        if (!dynamic[type][name]) {
          dynamic[type][name] = [];
        }

        dynamic[type][name].push(fn);
      } else {
        dynamic[type][name] = fn;
      }
    },

    // For debugging
    getAll() {
      return dynamic;
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
    loadProducts(products) {
      products.forEach(async(p) => {
        const impl = await p;

        if (impl.init) {
          impl.init(store, this);
        }
      });
    },

    addProducts(products) {
      if (!dynamic.products) {
        dynamic.products = [];
      }

      dynamic.products = dynamic.products.concat(products);

      // Initialize the product if the store is ready
      if (productsLoaded()) {
        this.loadProducts(products);
      }
    },

    // Add a locale to i18n
    addLocale(locale, label) {
      store.dispatch('i18n/addLocale', { locale, label });
    }
  });
}
