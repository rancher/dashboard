import { proxyUrlFromParts } from '@shell/plugins/steve/resourceUtils/service';

export function _getNormalizedGroup(resource) {
  if ( !resource.spec.group ) {
    return null;
  }

  return resource.spec.group
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function _getLabelDisplay(resource) {
  return resource.spec?.label || resource.metadata.name || '?';
}

export function _getLink(resource, _, rootGetters) {
  if ( resource.spec?.toURL ) {
    return resource.spec.toURL;
  } else if ( resource.spec?.toService ) {
    const service = resource.spec.toService;

    return proxyUrlFromParts(rootGetters.clusterId, service.namespace, service.name, service.scheme, service.port, service.path);
  } else {
    return null;
  }
}

export const calculatedFields = [
  { name: 'normalizedGroup', func: _getNormalizedGroup },
  { name: 'labelDisplay', func: _getLabelDisplay }
];
