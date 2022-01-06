import merge from 'lodash/merge';
import { DSL, productsLoaded } from '@shell/store/type-map';

export default function({
  app,
  store,
  $axios,
  redirect
}, inject) {
  const dynamic = {};

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

    registerDynamics(obj) {
      merge(dynamic, obj);
    },

    // For debugging
    getAll() {
      return dynamic;
    },

    getDynamic(typeName, name) {
      return dynamic[typeName]?.[name];
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
  });
}
