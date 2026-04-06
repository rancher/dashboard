// Note: This file exists and ESLint is disabled on it in .eslintignore because it currently chokes on import()s
// So it can be disabled just on this file that does nothing else, instead of every file that uses
// an import with a variable in the path.

import { defineAsyncComponent } from 'vue';

// Module maps are generated at build time by the dynamic-importer-modules Vite plugin.
// The plugin scans shell directories and excludes test files, keeping them out of the
// production bundle.  In Jest the companion .jest.js file provides the same exports
// via import.meta.glob (transformed by the babel plugin).
import {
  listModules,
  chartModules,
  editModules,
  detailModules,
  windowModules,
  machineConfigModules,
  cloudCredentialModules,
  promptRemoveModules,
  productModules,
  loginModules,
  dialogModules,
  drawerModules,
  translationModules,
} from '@rancher/dynamic-importer-modules';

function normalizePrefix(prefix) {
  // The virtual module uses /shell/ prefix in keys
  return prefix.replace(/^@shell\//, '/shell/');
}

function findInGlob(modules, prefix, key) {
  const resolved = normalizePrefix(prefix);
  // Try direct file extensions, then index files in subdirectories
  // (mirrors Node.js module resolution: foo → foo.vue OR foo/index.vue)
  const suffixes = ['', '.vue', '.js', '.ts', '/index.vue', '/index.js', '/index.ts'];

  for (const suffix of suffixes) {
    const candidate = `${ resolved }/${ key }${ suffix }`;

    if (modules[candidate]) {
      return candidate;
    }
  }

  return null;
}

function loadFromGlob(modules, prefix, name) {
  const key = findInGlob(modules, prefix, name);

  if (!key) {
    throw new Error(`Could not find module "${ prefix }/${ name }"`);
  }

  return modules[key]();
}

export function importCloudCredential(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => loadFromGlob(cloudCredentialModules, '@shell/cloud-credential', name));
}

export function importMachineConfig(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => loadFromGlob(machineConfigModules, '@shell/machine-config', name));
}

export function importLogin(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => loadFromGlob(loginModules, '@shell/components/auth/login', name));
}

export function importChart(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => loadFromGlob(chartModules, '@shell/chart', name));
}

export function importList(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => loadFromGlob(listModules, '@shell/list', name));
}

export function importDetail(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => loadFromGlob(detailModules, '@shell/detail', name));
}

export function importEdit(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => loadFromGlob(editModules, '@shell/edit', name));
}

export function importDialog(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => loadFromGlob(dialogModules, '@shell/dialog', name));
}

export function importDrawer(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => loadFromGlob(drawerModules, '@shell/components/Drawer', name));
}

export function importWindowComponent(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(() => loadFromGlob(windowModules, '@shell/components/Window', name));
}

export function loadProduct(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return loadFromGlob(productModules, '@shell/config/product', name);
}

export function listProducts() {
  return Object.keys(productModules)
    .map((p) => p.split('/').pop().replace(/\.(js|ts)$/, ''));
}

export function loadTranslation(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  const key = `/shell/assets/translations/${ name }.yaml`;

  if (!translationModules[key]) {
    throw new Error(`Could not find translation "${ name }"`);
  }

  return translationModules[key]();
}

export function importCustomPromptRemove(name) {
  return defineAsyncComponent(() => loadFromGlob(promptRemoveModules, '@shell/promptRemove', name));
}

function resolveOrThrow(modules, prefix, key) {
  const result = findInGlob(modules, prefix, key);

  if (!result) {
    // hasCustom() in type-map.js relies on resolve* functions throwing
    // to detect missing modules (matching the old require.resolve behaviour).
    const err = new Error(`Could not resolve module: ${ prefix }/${ key }`);

    err.code = 'MODULE_NOT_FOUND';
    throw err;
  }

  return result;
}

export function resolvePromptRemove(key) {
  return resolveOrThrow(promptRemoveModules, '@shell/promptRemove', key);
}

export function resolveList(key) {
  return resolveOrThrow(listModules, '@shell/list', key);
}

export function resolveChart(key) {
  return resolveOrThrow(chartModules, '@shell/chart', key);
}

export function resolveEdit(key) {
  return resolveOrThrow(editModules, '@shell/edit', key);
}

export function resolveDetail(key) {
  return resolveOrThrow(detailModules, '@shell/detail', key);
}

export function resolveWindowComponent(key) {
  return resolveOrThrow(windowModules, '@shell/components/Window', key);
}

export function resolveMachineConfigComponent(key) {
  return resolveOrThrow(machineConfigModules, '@shell/machine-config', key);
}

export function resolveCloudCredentialComponent(key) {
  return resolveOrThrow(cloudCredentialModules, '@shell/cloud-credential', key);
}
