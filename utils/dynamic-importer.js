// Note: This file exists and ESLint is disabled on it in .eslintignore because it currently chokes on import()s
// So it can be disabled just on this file that does nothing else, instead of every file that uses
// an import with a variable in the path.

export function importCloudCredential(name) {
  return () => import(/* webpackChunkName: "cloud-credential" */ `@/edit/rancher.cattle.io.cluster/credential/${name}`);
}

export function importNodeConfig(name) {
  return () => import(/* webpackChunkName: "node-config" */ `@/edit/rancher.cattle.io.cluster/node-config/${name}`);
}

export function importLogin(name) {
  return () => import(/* webpackChunkName: "login" */ `@/components/auth/login/${name}`);
}

export function importChart(name) {
  return () => import(/* webpackChunkName: "chart" */ `@/chart/${name}`);
}

export function importList(name) {
  return () => import(/* webpackChunkName: name */ `@/list/${name}`);
}

export function importDetail(name) {
  return () => import(/* webpackChunkName: name */ `@/detail/${name}`);
}

export function importEdit(name) {
  return () => import(/* webpackChunkName: name */ `@/edit/${name}`);
}

export function loadProduct(name) {
  // Note: directly returns the import, not a function
  return import(/* webpackChunkNAme: name */ `@/config/product/${ name }`);
}
