// Vite flavour of @shell/utils/dynamic-importer. Webpack can resolve dynamic
// imports like import(`@shell/list/${ name }`) at compile time, Vite cannot, so
// this variant backs each lookup with an import.meta.glob map. It is swapped in
// for the webpack version via an alias in shell/vite.config.ts (the same
// pattern shell/pkg/vue.config.js uses for dynamic-importer.lib.js).

import { defineAsyncComponent } from 'vue';

const contexts = {
  cloudCredential: import.meta.glob(['/shell/cloud-credential/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
  machineConfig:   import.meta.glob(['/shell/machine-config/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
  login:           import.meta.glob(['/shell/components/auth/login/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
  chart:           import.meta.glob(['/shell/chart/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
  list:            import.meta.glob(['/shell/list/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
  detail:          import.meta.glob(['/shell/detail/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
  edit:            import.meta.glob(['/shell/edit/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
  dialog:          import.meta.glob(['/shell/dialog/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
  drawer:          import.meta.glob(['/shell/components/Drawer/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
  window:          import.meta.glob(['/shell/components/Window/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
  product:         import.meta.glob(['/shell/config/product/**/*.{js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
  translation:     import.meta.glob(['/shell/assets/translations/*.yaml', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
  promptRemove:    import.meta.glob(['/shell/promptRemove/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/__mocks__/**', '!**/*.test.*', '!**/*.spec.*', '!**/*.d.ts']),
};

const prefixes = {
  cloudCredential: '/shell/cloud-credential/',
  machineConfig:   '/shell/machine-config/',
  login:           '/shell/components/auth/login/',
  chart:           '/shell/chart/',
  list:            '/shell/list/',
  detail:          '/shell/detail/',
  edit:            '/shell/edit/',
  dialog:          '/shell/dialog/',
  drawer:          '/shell/components/Drawer/',
  window:          '/shell/components/Window/',
  product:         '/shell/config/product/',
  translation:     '/shell/assets/translations/',
  promptRemove:    '/shell/promptRemove/',
};

function resolveKey(context, name) {
  const modules = contexts[context];
  const base = prefixes[context] + name;
  const candidates = [
    base,
    `${ base }.vue`,
    `${ base }.js`,
    `${ base }.ts`,
    `${ base }/index.vue`,
    `${ base }/index.js`,
    `${ base }/index.ts`,
  ];

  return candidates.find((candidate) => candidate in modules);
}

function load(context, name) {
  if (!name) {
    throw new Error('Name required');
  }

  const key = resolveKey(context, name);

  if (!key) {
    const error = new Error(`Cannot find module '${ prefixes[context] }${ name }'`);

    error.code = 'MODULE_NOT_FOUND';

    return Promise.reject(error);
  }

  return contexts[context][key]();
}

function resolve(context, name) {
  const key = resolveKey(context, name);

  if (!key) {
    const error = new Error(`Cannot find module '${ prefixes[context] }${ name }'`);

    error.code = 'MODULE_NOT_FOUND';

    throw error;
  }

  return key;
}

export function importCloudCredential(name) {
  return defineAsyncComponent(() => load('cloudCredential', name));
}

export function importMachineConfig(name) {
  return defineAsyncComponent(() => load('machineConfig', name));
}

export function importLogin(name) {
  return defineAsyncComponent(() => load('login', name));
}

export function importChart(name) {
  return defineAsyncComponent(() => load('chart', name));
}

export function importList(name) {
  return defineAsyncComponent(() => load('list', name));
}

export function importDetail(name) {
  return defineAsyncComponent(() => load('detail', name));
}

export function importEdit(name) {
  return defineAsyncComponent(() => load('edit', name));
}

export function importDialog(name) {
  return defineAsyncComponent(() => load('dialog', name));
}

export function importDrawer(name) {
  return defineAsyncComponent(() => load('drawer', name));
}

export function importWindowComponent(name) {
  return defineAsyncComponent(() => load('window', name));
}

export function loadProduct(name) {
  // Note: directly returns the import, not a function
  return load('product', name);
}

export function listProducts() {
  return Object.keys(contexts.product)
    .map((key) => key.substr(prefixes.product.length))
    .map((key) => key.slice(0, -3));
}

export function loadTranslation(name) {
  // Note: directly returns the import, not a function
  return load('translation', `${ name }.yaml`);
}

export function importCustomPromptRemove(name) {
  return defineAsyncComponent(() => load('promptRemove', name));
}

export function resolveList(key) {
  return resolve('list', key);
}

export function resolveChart(key) {
  return resolve('chart', key);
}

export function resolveEdit(key) {
  return resolve('edit', key);
}

export function resolveDetail(key) {
  return resolve('detail', key);
}

export function resolveWindowComponent(key) {
  return resolve('window', key);
}

export function resolveMachineConfigComponent(key) {
  return resolve('machineConfig', key);
}

export function resolveCloudCredentialComponent(key) {
  return resolve('cloudCredential', key);
}
