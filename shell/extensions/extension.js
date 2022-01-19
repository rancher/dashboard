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

    load(name, mainFile) {
      const router = app.router;
      const moduleUrl = mainFile;
      const element = document.createElement('script');

      element.src = moduleUrl;
      element.type = 'text/javascript';
      element.async = true;

      element.onload = () => {
        element.parentElement.removeChild(element);
        window[name].default(router, store, this);
      };

      element.onerror = () => {
        element.parentElement.removeChild(element);
      };

      document.head.appendChild(element);
    },

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

    register(type, name, fn) {
      if (!dynamic[type]) {
        dynamic[type] = {};
      }

      // Accumulate i18n resources
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

    get lastLoad() {
      return _lastLoaded;
    },

    listDynamic(typeName) {
      if (!dynamic[typeName]) {
        return [];
      }

      return Object.keys(dynamic[typeName]);
    },

    get products() {
      return dynamic.products || [];
    },

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

    addLocale(locale, label) {
      store.dispatch('i18n/addLocale', { locale, label });
    }
  });
}
