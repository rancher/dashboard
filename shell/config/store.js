import { createStore } from 'vuex';

const VUEX_PROPERTIES = ['state', 'getters', 'actions', 'mutations'];

let store = {};

(function updateModules() {
  store = normalizeRoot(require('../store/index.js'), 'store/index.js');

  // If store is an exported method = classic mode (deprecated)

  if (typeof store === 'function') {
    return console.warn('Classic mode for store/ is deprecated and will be removed in Nuxt 3.'); // eslint-disable-line no-console
  }

  // Enforce store modules
  store.modules = store.modules || {};

  resolveStoreModules(require('../store/action-menu.js'), 'action-menu.js');
  resolveStoreModules(require('../store/auth.js'), 'auth.js');
  resolveStoreModules(require('../store/aws.js'), 'aws.js');
  resolveStoreModules(require('../store/catalog.js'), 'catalog.js');
  resolveStoreModules(require('../store/digitalocean.js'), 'digitalocean.js');
  resolveStoreModules(require('../store/features.js'), 'features.js');
  resolveStoreModules(require('../store/github.js'), 'github.js');
  resolveStoreModules(require('../store/gitlab.js'), 'gitlab.js');
  resolveStoreModules(require('../store/growl.js'), 'growl.js');
  resolveStoreModules(require('../store/i18n.js'), 'i18n.js');
  resolveStoreModules(require('../store/linode.js'), 'linode.js');
  resolveStoreModules(require('../store/plugins.js'), 'plugins.js');
  resolveStoreModules(require('../store/pnap.js'), 'pnap.js');
  resolveStoreModules(require('../store/prefs.js'), 'prefs.js');
  resolveStoreModules(require('../store/resource-fetch.js'), 'resource-fetch.js');
  resolveStoreModules(require('../store/type-map.js'), 'type-map.js');
  resolveStoreModules(require('../store/uiplugins.ts'), 'uiplugins.ts');
  resolveStoreModules(require('../store/wm.js'), 'wm.js');
  resolveStoreModules(require('../store/customisation.js'), 'customisation.js');
  resolveStoreModules(require('../store/cru-resource.ts'), 'cru-resource.ts');

  // If the environment supports hot reloading...

  if (module.hot) {
    // Whenever any Vuex module is updated...
    module.hot.accept([
      '../store/action-menu.js',
      '../store/auth.js',
      '../store/aws.js',
      '../store/catalog.js',
      '../store/digitalocean.js',
      '../store/features.js',
      '../store/github.js',
      '../store/gitlab.js',
      '../store/growl.js',
      '../store/i18n.js',
      '../store/index.js',
      '../store/linode.js',
      '../store/plugins.js',
      '../store/pnap.js',
      '../store/prefs.js',
      '../store/resource-fetch.js',
      '../store/type-map.js',
      '../store/uiplugins.ts',
      '../store/wm.js',
      '../store/customisation.js',
      '../store/cru-resource.ts',
    ], () => {
      // Update `root.modules` with the latest definitions.
      updateModules();
      // Trigger a hot update in the store.
      window.$globalApp.$store.hotUpdate(store);
    });
  }
})();

// extendStore
export const extendStore = store instanceof Function ? store : () => {
  return createStore(Object.assign({ strict: (process.env.NODE_ENV !== 'production') }, store));
};

function normalizeRoot(moduleData, filePath) {
  moduleData = moduleData.default || moduleData;

  if (moduleData.commit) {
    throw new Error(`[nuxt] ${ filePath } should export a method that returns a Vuex instance.`);
  }

  if (typeof moduleData !== 'function') {
    // Avoid TypeError: setting a property that has only a getter when overwriting top level keys
    moduleData = Object.assign({}, moduleData);
  }

  return normalizeModule(moduleData, filePath);
}

function normalizeModule(moduleData, filePath) {
  if (moduleData.state && typeof moduleData.state !== 'function') {
    console.warn(`'state' should be a method that returns an object in ${ filePath }`); // eslint-disable-line no-console

    const state = Object.assign({}, moduleData.state);

    // Avoid TypeError: setting a property that has only a getter when overwriting top level keys
    moduleData = Object.assign({}, moduleData, { state: () => state });
  }

  return moduleData;
}

function resolveStoreModules(moduleData, filename) {
  moduleData = moduleData.default || moduleData;
  // Remove store src + extension (./foo/index.js -> foo/index)
  const namespace = filename.replace(/\.(js|mjs|ts)$/, '');
  const namespaces = namespace.split('/');
  let moduleName = namespaces[namespaces.length - 1];
  const filePath = `store/${ filename }`;

  moduleData = moduleName === 'state' ? normalizeState(moduleData, filePath) : normalizeModule(moduleData, filePath);

  // If src is a known Vuex property
  if (VUEX_PROPERTIES.includes(moduleName)) {
    const property = moduleName;
    const propertyStoreModule = getStoreModule(store, namespaces, { isProperty: true });

    // Replace state since it's a function
    mergeProperty(propertyStoreModule, moduleData, property);

    return;
  }

  // If file is foo/index.js, it should be saved as foo
  const isIndexModule = (moduleName === 'index');

  if (isIndexModule) {
    namespaces.pop();
    moduleName = namespaces[namespaces.length - 1];
  }

  const storeModule = getStoreModule(store, namespaces);

  for (const property of VUEX_PROPERTIES) {
    mergeProperty(storeModule, moduleData[property], property);
  }

  if (moduleData.namespaced === false) {
    delete storeModule.namespaced;
  }
}

function normalizeState(moduleData, filePath) {
  if (typeof moduleData !== 'function') {
    console.warn(`${ filePath } should export a method that returns an object`); // eslint-disable-line no-console
    const state = Object.assign({}, moduleData);

    return () => state;
  }

  return normalizeModule(moduleData, filePath);
}

function getStoreModule(storeModule, namespaces, { isProperty = false } = {}) {
  // If ./mutations.js
  if (!namespaces.length || (isProperty && namespaces.length === 1)) {
    return storeModule;
  }

  const namespace = namespaces.shift();

  storeModule.modules[namespace] = storeModule.modules[namespace] || {};
  storeModule.modules[namespace].namespaced = true;
  storeModule.modules[namespace].modules = storeModule.modules[namespace].modules || {};

  return getStoreModule(storeModule.modules[namespace], namespaces, { isProperty });
}

function mergeProperty(storeModule, moduleData, property) {
  if (!moduleData) {
    return;
  }

  if (property === 'state') {
    storeModule.state = moduleData || storeModule.state;
  } else {
    storeModule[property] = Object.assign({}, storeModule[property], moduleData);
  }
}
