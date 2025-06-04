/**
 * Store version data retrieved from the backend /rancherversion API
 */
let _versionData = {
  Version:      '',
  RancherPrime: 'false',
  GitCommit:    '',
};
let _kubeVersionData = {};

export function isRancherPrime() {
  return _versionData.RancherPrime?.toLowerCase() === 'true';
}

export function getVersionData() {
  return _versionData;
}

export function setVersionData(v) {
  // Remove any properties on 'v' we don't want
  _versionData = JSON.parse(JSON.stringify(v));
}

export function getKubeVersionData() {
  return _kubeVersionData;
}

export function setKubeVersionData(v) {
  // Remove any properties on 'v' we don't want
  _kubeVersionData = JSON.parse(JSON.stringify(v));
}

export const CURRENT_RANCHER_VERSION = '2.11';
