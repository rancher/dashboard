# Custom VueX Stores

Extensions may want to define their own custom VueX stores.

## Initializing Extension Stores

Extensions should explicitly register any store modules in their `index.ts` by using the `addDashboardStore` extension method. This will also add familiar [Vuex](https://vuex.vuejs.org/) actions for retrieving and classifying resources, details of which can be found in `shell/plugins/dashboard-store/index`.

An example would be to define in the folder `store` of your extension a basic configuration on an `index.ts` file, such as:

```ts
import { CoreStoreSpecifics, CoreStoreConfig } from '@shell/core/types';
import getters from './getters'; // this would be your getters file on your extension /store folder
import mutations from './mutations'; // this would be your mutations file on your extension /store folder
import actions from './actions'; // this would be your actions file on your extension /store folder

// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used
const YOUR_PRODUCT_NAME = 'the-name-of-your-product';

const yourExtensionFactory = (): CoreStoreSpecifics => {
  return {
    state() {
      return { someStateVariable: '' };
    },

    getters: { ...getters },

    mutations: { ...mutations },

    actions: { ...actions },
  };
};
const config: CoreStoreConfig = { namespace: YOUR_PRODUCT_NAME };

export default {
  specifics: yourExtensionFactory(),
  config
};
```

In the `store` folder you just need to create the `getters.js`, `actions.js` and `mutations.js` files and write up your store code there, based on the convention of [Vuex](https://vuex.vuejs.org/).

And on the `index.ts` on your root folder, where you define your extension configuration, you can just use the `addDashboardStore` extension method, such as:

```ts
import { importTypes } from '@rancher/auto-import';
import { IPlugin } from '@shell/core/types';
import extensionStore from './store';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide extension metadata from package.json
  // it will grab information such as `name` and `description`
  plugin.metadata = require('./package.json');

  // Load a product
  plugin.addProduct(require('./product'));
  
  // => => => Add Vuex store
  plugin.addDashboardStore(extensionStore.config.namespace, extensionStore.specifics, extensionStore.config);
}
```


Extensions can optionally define their own cluster store module by setting `isClusterStore` in the store index, eg:
```ts
// to achieve naming consistency throughout the extension
// we recommend this to be defined on a config file and exported
// so that the developer can import it wherever it needs to be used
const YOUR_PRODUCT_NAME = 'the-name-of-your-product';

const config: CoreStoreConfig = {
  namespace:      YOUR_PRODUCT_NAME,
  isClusterStore: true
};

export default {
  specifics: harvesterFactory(),
  config,
  init:      steveStoreInit
};
```

This will cause the shell `loadCluster` action to run the extension's `loadCluster` action when entering a package, and the extension store's `unsubscribe` and `reset` when leaving. 


