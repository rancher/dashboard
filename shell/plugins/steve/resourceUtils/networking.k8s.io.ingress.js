import isEmpty from 'lodash/isEmpty';

export function _getDefaultBackendPath(resource, _, rootGetters) {
  const defaultBackend = rootGetters['cluster/pathExistsInSchema'](resource.type, 'spec.defaultBackend');

  return defaultBackend ? 'defaultBackend' : 'backend';
}

export function _getHasDefaultBackend(resource) {
  return !isEmpty(resource.spec[resource.defaultBackendPath]);
}

export const calculatedFields = [
  { name: 'defaultBackendPath', func: _getDefaultBackendPath },
  { name: 'hasDefaultBackend', func: _getHasDefaultBackend }
];
