import { createStore } from 'vuex';

import * as storeIndex from '../store/index.js';
import * as storeActionMenu from '../store/action-menu.js';
import * as storeAuth from '../store/auth.js';
import * as storeAws from '../store/aws.js';
import * as storeCatalog from '../store/catalog.js';
import * as storeDigitalocean from '../store/digitalocean.js';
import * as storeFeatures from '../store/features.js';
import * as storeGithub from '../store/github.js';
import * as storeGitlab from '../store/gitlab.js';
import * as storeGrowl from '../store/growl.js';
import * as storeI18n from '../store/i18n.js';
import * as storeLinode from '../store/linode.js';
import * as storeModal from '../store/modal.ts';
import * as storePlugins from '../store/plugins.js';
import * as storePnap from '../store/pnap.js';
import * as storePrefs from '../store/prefs.js';
import * as storeResourceFetch from '../store/resource-fetch.js';
import * as storeSlideInPanel from '../store/slideInPanel.ts';
import * as storeTypeMap from '../store/type-map.js';
import * as storeUiplugins from '../store/uiplugins.ts';
import * as storeWm from '../store/wm.ts';
import * as storeCustomisation from '../store/customisation.js';
import * as storeCruResource from '../store/cru-resource.ts';
import * as storeNotifications from '../store/notifications.ts';
import * as storeCookies from '../store/cookies.ts';
import * as storeUiContext from '../store/ui-context.ts';

const VUEX_PROPERTIES = ['state', 'getters', 'actions', 'mutations'];

let store = {};

function updateModules() {
  store = normalizeRoot(storeIndex, 'store/index.js');

  // If store is an exported method = classic mode (deprecated)

  if (typeof store === 'function') {
    return console.warn('Classic mode for store/ is deprecated and will be removed in Nuxt 3.'); // eslint-disable-line no-console
  }

  // Enforce store modules
  store.modules = store.modules || {};

  resolveStoreModules(storeActionMenu, 'action-menu.js');
  resolveStoreModules(storeAuth, 'auth.js');
  resolveStoreModules(storeAws, 'aws.js');
  resolveStoreModules(storeCatalog, 'catalog.js');
  resolveStoreModules(storeDigitalocean, 'digitalocean.js');
  resolveStoreModules(storeFeatures, 'features.js');
  resolveStoreModules(storeGithub, 'github.js');
  resolveStoreModules(storeGitlab, 'gitlab.js');
  resolveStoreModules(storeGrowl, 'growl.js');
  resolveStoreModules(storeI18n, 'i18n.js');
  resolveStoreModules(storeLinode, 'linode.js');
  resolveStoreModules(storeModal, 'modal.ts');
  resolveStoreModules(storePlugins, 'plugins.js');
  resolveStoreModules(storePnap, 'pnap.js');
  resolveStoreModules(storePrefs, 'prefs.js');
  resolveStoreModules(storeResourceFetch, 'resource-fetch.js');
  resolveStoreModules(storeSlideInPanel, 'slideInPanel.ts');
  resolveStoreModules(storeTypeMap, 'type-map.js');
  resolveStoreModules(storeUiplugins, 'uiplugins.ts');
  resolveStoreModules(storeWm, 'wm.ts');
  resolveStoreModules(storeCustomisation, 'customisation.js');
  resolveStoreModules(storeCruResource, 'cru-resource.ts');
  resolveStoreModules(storeNotifications, 'notifications.ts');
  resolveStoreModules(storeCookies, 'cookies.ts');
  resolveStoreModules(storeUiContext, 'ui-context.ts');
}

updateModules();

// Vite HMR support
if (import.meta.hot) {
  import.meta.hot.accept([
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
    '../store/modal.ts',
    '../store/plugins.js',
    '../store/pnap.js',
    '../store/prefs.js',
    '../store/resource-fetch.js',
    '../store/slideInPanel.ts',
    '../store/type-map.js',
    '../store/uiplugins.ts',
    '../store/wm.ts',
    '../store/customisation.js',
    '../store/cru-resource.ts',
    '../store/notifications.ts',
    '../store/cookies.ts',
    '../store/ui-context.ts',
  ], () => {
    // Update `root.modules` with the latest definitions.
    updateModules();
    // Trigger a hot update in the store.
    window.$globalApp.$store.hotUpdate(store);
  });
}

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
