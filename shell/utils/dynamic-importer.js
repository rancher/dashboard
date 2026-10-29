import { defineAsyncComponent } from 'vue';

const cloudCredentials = import.meta.glob(['../cloud-credential/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/*.d.ts']);
const machineConfigs = import.meta.glob(['../machine-config/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/*.d.ts']);
const logins = import.meta.glob(['../components/auth/login/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/*.d.ts']);
const charts = import.meta.glob(['../chart/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/*.d.ts']);
const lists = import.meta.glob(['../list/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/*.d.ts']);
const details = import.meta.glob(['../detail/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/*.d.ts']);
const edits = import.meta.glob(['../edit/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/*.d.ts']);
const dialogs = import.meta.glob(['../dialog/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/*.d.ts']);
const drawers = import.meta.glob(['../components/Drawer/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/*.d.ts']);
const windowComponents = import.meta.glob(['../components/Window/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/*.d.ts']);
const products = import.meta.glob(['../config/product/**/*.{js,ts}', '!**/__tests__/**', '!**/*.d.ts']);
const translations = import.meta.glob('../assets/translations/*.yaml');
const promptRemoves = import.meta.glob(['../promptRemove/**/*.{vue,js,ts}', '!**/__tests__/**', '!**/*.d.ts']);

const SUFFIXES = ['', '.js', '.vue', '.ts', '/index.js', '/index.vue', '/index.ts'];

function find(modules, folder, name) {
  const suffix = SUFFIXES.find((s) => modules[`${ folder }/${ name }${ s }`]);

  return suffix === undefined ? undefined : modules[`${ folder }/${ name }${ suffix }`];
}

function load(modules, folder, name) {
  const loader = find(modules, folder, name);

  return loader ? loader() : Promise.reject(new Error(`Cannot find module '${ folder }/${ name }'`));
}

function resolve(modules, folder, name) {
  if (!find(modules, folder, name)) {
    throw new Error(`Cannot find module '${ folder }/${ name }'`);
  }

  return `${ folder }/${ name }`;
}

export function importCloudCredential(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => load(cloudCredentials, '../cloud-credential', name));
}

export function importMachineConfig(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => load(machineConfigs, '../machine-config', name));
}

export function importLogin(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => load(logins, '../components/auth/login', name));
}

export function importChart(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => load(charts, '../chart', name));
}

export function importList(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => load(lists, '../list', name));
}

export function importDetail(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => load(details, '../detail', name));
}

export function importEdit(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => load(edits, '../edit', name));
}

export function importDialog(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => load(dialogs, '../dialog', name));
}

export function importDrawer(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => load(drawers, '../components/Drawer', name));
}

export function importWindowComponent(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => load(windowComponents, '../components/Window', name));
}

export function loadProduct(name) {
  if (!name) {
    throw new Error('Name required');
  }

  // Note: directly returns the import, not a function
  return load(products, '../config/product', name);
}

export function listProducts() {
  return Object.keys(products).map((path) => path.replace('../config/product/', '').replace(/\.(js|ts)$/, ''));
}

export function loadTranslation(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  // Note: directly returns the import, not a function
  return load(translations, '../assets/translations', `${ name }.yaml`);
}

export function importCustomPromptRemove(name) {
  return defineAsyncComponent(() => load(promptRemoves, '../promptRemove', name));
}

export function resolveList(key) {
  return resolve(lists, '../list', key);
}

export function resolveChart(key) {
  return resolve(charts, '../chart', key);
}

export function resolveEdit(key) {
  return resolve(edits, '../edit', key);
}

export function resolveDetail(key) {
  return resolve(details, '../detail', key);
}

export function resolveWindowComponent(key) {
  return resolve(windowComponents, '../components/Window', key);
}

export function resolveMachineConfigComponent(key) {
  return resolve(machineConfigs, '../machine-config', key);
}

export function resolveCloudCredentialComponent(key) {
  return resolve(cloudCredentials, '../cloud-credential', key);
}

export function resolveCustomPromptRemove(key) {
  return resolve(promptRemoves, '../promptRemove', key);
}
