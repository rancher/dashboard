import { POD } from '@shell/config/types';
import { LOCAL } from '@shell/config/query-params';

export function _getName(resource) {
  return resource.metadata.name;
}

export function _getPods(resource, getters) {
  // ToDo: SM resource could/should be heavily optimized
  const allPods = getters.all(POD);

  return allPods.filter(pod => pod.spec.nodeName === resource.name);
}

export function _getClusterId(resource) {
  const parts = resource.links.self.split('/');

  // Local cluster url links omit `/k8s/clusters/<cluster id>`
  // `/v1/nodes` vs `k8s/clusters/c-m-274kcrc4/v1/nodes`
  // Be safe when determining this, so work back through the url from a known point
  if (parts.length > 6 && parts[parts.length - 6] === 'k8s' && parts[parts.length - 5] === 'clusters') {
    return parts[parts.length - 4];
  }

  return LOCAL;
}

export function _getVersion(resource) {
  return resource.status.nodeInfo.kubeletVersion;
}

export const calculatedFields = [
  { name: 'name', func: _getName },
  {
    name: 'pods', func: _getPods, caches: [POD]
  },
  { name: 'clusterId', func: _getClusterId },
  { name: 'version', func: _getVersion }
];
