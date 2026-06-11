// Backwards-compatibility shim for extensions and Cypress that import the .js path.
// Type declarations are in version.d.ts. The reactive implementation is in version.ts.
// Extensions importing this file directly still have webpack module isolation (same
// behaviour as before this PR), so isRancherPrime() reflects only their local state.
// New code should use useVersion() from @shell/apis instead.

let _versionData = {
  Version:      '',
  RancherPrime: 'false',
  GitCommit:    '',
};
let _kubeVersionData = {};

export function isRancherPrime() {
  return _versionData?.RancherPrime?.toLowerCase() === 'true';
}

export function getVersionData() {
  return _versionData;
}

export function setVersionData(v) {
  _versionData = v;
}

export function getKubeVersionData() {
  return _kubeVersionData;
}

export function setKubeVersionData(v) {
  _kubeVersionData = v;
}

export const CURRENT_RANCHER_VERSION = '2.14';
