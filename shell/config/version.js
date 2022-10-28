/**
 * Store version data retrieved from the backend /rancherversion API
 */
let _versionData = { RancherPrime: 'false' };

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
