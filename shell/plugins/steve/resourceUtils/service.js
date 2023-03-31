import { POD } from '@shell/config/types';

export function proxyUrlFromBase(base, scheme, name, port, path) {
  const schemaNamePort = (scheme ? `${ escape(scheme) }:` : '') + escape(name) + (port ? `:${ escape(port) }` : '');

  const cleanPath = `/${ (path || '').replace(/^\/+/g, '') }`;
  const cleanBase = base.replace(/\/+$/g, '');

  const out = `${ cleanBase }/${ schemaNamePort }/proxy${ cleanPath }`;

  return out;
}

export function proxyUrlFromParts(clusterId, namespace, name, scheme, port, path) {
  const base = `/k8s/clusters/${ escape(clusterId) }/api/v1/namespaces/${ escape(namespace) }/services`;

  return proxyUrlFromBase(base, scheme, name, port, path);
}

export function _getPodRelationship(resource) {
  const { metadata:{ relationships = [] } } = resource;

  return (relationships || []).filter(relationship => relationship.toType === POD)[0];
}

export function _getPods(resource, getters) {
  return resource.podRelationship ? getters.matching( POD, resource.podRelationship.selector, resource.namespace ) : [];
}

export const calculatedFields = [
  { name: 'podRelationship', func: _getPodRelationship },
  {
    name: 'pods', func: _getPods, caches: [POD]
  }
];
