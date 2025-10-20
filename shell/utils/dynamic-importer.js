// Note: This file exists and ESLint is disabled on it in .eslintignore because it currently chokes on import()s
// So it can be disabled just on this file that does nothing else, instead of every file that uses
// an import with a variable in the path.

import { defineAsyncComponent } from 'vue';

export function importCloudCredential(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(resolveCloudCredentialComponent(name));
}

export function importMachineConfig(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(resolveMachineConfigComponent(name));
}

export function importLogin(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(resolveLogin(name));
}

export function importChart(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(resolveChart(name));
}

export function importList(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(resolveList(name));
}

export function importDetail(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(resolveDetail(name));
}

export function importEdit(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(resolveEdit(name));
}

export function importDialog(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(resolveDialog(name));
}

export function importDrawer(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(resolveDrawer(name));
}

export function importWindowComponent(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return defineAsyncComponent(resolveWindowComponent(name));
}

export function loadProduct(name) {
  if (!name) {
    throw new Error('Name required');
  }

  // Note: directly returns the import, not a function
  return import(/* webpackChunkName: "product" */ `@shell/config/product/${name}`);
}

export function listProducts() {
  const ctx = require.context('@shell/config/product', true, /.*/);
  const products = ctx.keys().filter(path => !path.endsWith('.js') && path.startsWith('./')).map(path => path.substr(2));

  return products;
}

export function loadTranslation(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  // Note: directly returns the import, not a function
  return import(/* webpackChunkName: "[request]" */ `@shell/assets/translations/${name}.yaml`);
}

export function importCustomPromptRemove(name) {
  return defineAsyncComponent(resolveCustomPromptRemove(name));
}

export function resolveList(key) {
  return () => import(/* webpackChunkName: "list" */ `@shell/list/${key}`);
}

export function resolveChart(key) {
  return () => import(/* webpackChunkName: "chart" */ `@shell/chart/${key}`)
}

export function resolveEdit(key) {
  return () => import(/* webpackChunkName: "edit" */ `@shell/edit/${key}`);
}

export function resolveDetail(key) {
  return () => import(/* webpackChunkName: "detail" */ `@shell/detail/${key}`)
}

export function resolveWindowComponent(key) {
  return () => import(/* webpackChunkName: "components/nav" */ `@shell/components/nav/WindowManager/${key}`)
}

export function resolveMachineConfigComponent(key) {
  return () => import(/* webpackChunkName: "machine-config" */ `@shell/machine-config/${key}`)
}

export function resolveCloudCredentialComponent(key) {
  return () => import(/* webpackChunkName: "cloud-credential" */ `@shell/cloud-credential/${key}`)
}

export function resolveLogin(key) {
  return () => import(/* webpackChunkName: "login" */ `@shell/components/auth/login/${key}`)
}

export function resolveDialog(key) {
  return () => import(/* webpackChunkName: "dialog" */ `@shell/dialog/${key}`)
}

export function resolveDrawer(key) {
  return () => import(/* webpackChunkName: "drawer" */ `@shell/components/Drawer/${key}`)
}

export function resolveCustomPromptRemove(key) {
  return () => import(/* webpackChunkName: "custom-prompt-remove" */ `@shell/promptRemove/${ key }`)
}
