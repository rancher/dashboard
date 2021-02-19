// Note: This file exists and ESLint is disabled on it in .eslintignore because it currently chokes on import()s
// So it can be disabled just on this file that does nothing else, instead of every file that uses
// an import with a variable in the path.

export function importCloudCredential(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "cloud-credential" */ `@/edit/rancher.cattle.io.cluster/credential/${name}`);
}

export function importNodeConfig(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "node-config" */ `@/edit/rancher.cattle.io.cluster/node-config/${name}`);
}

export function importLogin(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "login" */ `@/components/auth/login/${name}`);
}

export function importChart(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "chart" */ `@/chart/${name}`);
}

export function importList(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "list" */ `@/list/${name}`);
}

export function importDetail(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "detail" */ `@/detail/${name}`);
}

export function importEdit(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  return () => import(/* webpackChunkName: "edit" */ `@/edit/${name}`);
}

export function loadProduct(name) {
  if ( !name ) {
    throw new Error('Name required');
  }

  // Note: directly returns the import, not a function
  return import(/* webpackChunkNAme: "product" */ `@/config/product/${ name }`);
}
