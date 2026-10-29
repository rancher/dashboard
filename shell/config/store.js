import { createStore } from 'vuex';
import * as rootModule from '../store/index.js';
import * as actionMenuModule from '../store/action-menu.js';
import * as authModule from '../store/auth.js';
import * as awsModule from '../store/aws.js';
import * as catalogModule from '../store/catalog.ts';
import * as digitaloceanModule from '../store/digitalocean.js';
import * as featuresModule from '../store/features.js';
import * as githubModule from '../store/github.js';
import * as gitlabModule from '../store/gitlab.js';
import * as growlModule from '../store/growl.ts';
import * as i18nModule from '../store/i18n.ts';
import * as linodeModule from '../store/linode.js';
import * as modalModule from '../store/modal.ts';
import * as pluginsModule from '../store/plugins.js';
import * as pnapModule from '../store/pnap.js';
import * as prefsModule from '../store/prefs.ts';
import * as resourceFetchModule from '../store/resource-fetch.js';
import * as slideInPanelModule from '../store/slideInPanel.ts';
import * as typeMapModule from '../store/type-map.js';
import * as uipluginsModule from '../store/uiplugins.ts';
import * as wmModule from '../store/wm.ts';
import * as customisationModule from '../store/customisation.js';
import * as cruResourceModule from '../store/cru-resource.ts';
import * as notificationsModule from '../store/notifications.ts';
import * as cookiesModule from '../store/cookies.ts';
import * as uiContextModule from '../store/ui-context.ts';

const VUEX_PROPERTIES = ['state', 'getters', 'actions', 'mutations'];

let store = {};
let root = rootModule;
const modules = {
  'action-menu.js':    actionMenuModule,
  'auth.js':           authModule,
  'aws.js':            awsModule,
  'catalog.ts':        catalogModule,
  'digitalocean.js':   digitaloceanModule,
  'features.js':       featuresModule,
  'github.js':         githubModule,
  'gitlab.js':         gitlabModule,
  'growl.ts':          growlModule,
  'i18n.ts':           i18nModule,
  'linode.js':         linodeModule,
  'modal.ts':          modalModule,
  'plugins.js':        pluginsModule,
  'pnap.js':           pnapModule,
  'prefs.ts':          prefsModule,
  'resource-fetch.js': resourceFetchModule,
  'slideInPanel.ts':   slideInPanelModule,
  'type-map.js':       typeMapModule,
  'uiplugins.ts':      uipluginsModule,
  'wm.ts':             wmModule,
  'customisation.js':  customisationModule,
  'cru-resource.ts':   cruResourceModule,
  'notifications.ts':  notificationsModule,
  'cookies.ts':        cookiesModule,
  'ui-context.ts':     uiContextModule,
};

function updateModules() {
  store = normalizeRoot(root, 'store/index.js');

  // If store is an exported method = classic mode (deprecated)

  if (typeof store === 'function') {
    return console.warn('Classic mode for store/ is deprecated and will be removed in Nuxt 3.'); // eslint-disable-line no-console
  }

  // Enforce store modules
  store.modules = store.modules || {};

  Object.entries(modules).forEach(([filename, moduleData]) => resolveStoreModules(moduleData, filename));
}

updateModules();

// If the environment supports hot reloading...

if (import.meta.hot) {
  // Whenever any Vuex module is updated...
  import.meta.hot.accept([
    '../store/index.js',
    '../store/action-menu.js',
    '../store/auth.js',
    '../store/aws.js',
    '../store/catalog.ts',
    '../store/digitalocean.js',
    '../store/features.js',
    '../store/github.js',
    '../store/gitlab.js',
    '../store/growl.ts',
    '../store/i18n.ts',
    '../store/linode.js',
    '../store/modal.ts',
    '../store/plugins.js',
    '../store/pnap.js',
    '../store/prefs.ts',
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
  ], ([newRoot, ...newModules]) => {
    // Update `root.modules` with the latest definitions.
    root = newRoot || root;
    Object.keys(modules).forEach((filename, i) => {
      modules[filename] = newModules[i] || modules[filename];
    });
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
