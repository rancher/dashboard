// Note: This file exists and ESLint is disabled on it in .eslintignore because it currently chokes on import()s
// So it can be disabled just on this file that does nothing else, instead of every file that uses
// an import with a variable in the path.

export function importCloudCredential(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "cloud-credential" */ `@shell/cloud-credential/${name}`);
}

export function importMachineConfig(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "machine-config" */ `@shell/machine-config/${name}`);
}

export function importLogin(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "login" */ `@shell/components/auth/login/${name}`);
}

export function importChart(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "chart" */ `@shell/chart/${name}`);
}

export function importList(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "list" */ `@shell/list/${name}`);
}

export function importDetail(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "detail" */ `@shell/detail/${name}`);
}

export function importEdit(name) {
  if (!name) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "edit" */ `@shell/edit/${name}`);
}

export function importDialog(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "dialog" */ `@shell/components/dialog/${name}`);
}

export function importWindowComponent(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "components/nav" */ `@shell/components/nav/WindowManager/${name}`);
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
  const products = ctx.keys().filter(path => !path.endsWith('.js')).map(path => path.substr(2));

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
  return () => import(/* webpackChunkName: "custom-prompt-remove" */ `@shell/promptRemove/${ name }`);
}

export function resolveList(key) {
  return require.resolve(`@shell/list/${ key }`);
}

export function resolveEdit(key) {
  return require.resolve(`@shell/edit/${ key }`);
}

export function resolveDetail(key) {
  return require.resolve(`@shell/detail/${ key }`);
}

export function resolveWindowComponent(key) {
  return require.resolve(`@shell/components/nav/WindowManager/${ key }`);
}
