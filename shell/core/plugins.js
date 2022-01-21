import { DSL as STORE_DSL, productsLoaded } from '@shell/store/type-map';

export default function({
  app,
  store,
  $axios,
  redirect
}, inject) {
  const dynamic = {};
  let _lastLoaded = 0;

  inject('plugin', {

    DSL(productName) {
      return STORE_DSL(this.store, productName);
    },

    get store() {
      return store;
    },

    get router() {
      return app.router;
    },

    // Load a plugin from a UI package
    loadAsync(name, mainFile) {
      return new Promise((resolve, reject) => {
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
          window[name].default(this);
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
          impl.init(this);
        }
      });
    },

    addProduct(product) {
      if (!dynamic.products) {
        dynamic.products = [];
      }

      dynamic.products.push(product);

      // Initialize the product if the store is ready
      if (productsLoaded()) {
        this.loadProducts([product]);
      }
    },

    // Add a locale to i18n
    addLocale(locale, label) {
      store.dispatch('i18n/addLocale', { locale, label });
    }
  });
}
