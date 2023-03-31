import { MANAGEMENT } from '@shell/config/types';

export function _getNodeTemplate(resource, getters, rootGetters) {
  const id = (resource.spec?.nodeTemplateName || '').replace(/:/, '/');
  const template = getters.byId(MANAGEMENT.NODE_TEMPLATE, id);

  return template;
}

export function _getProviderDisplay(resource) {
  return resource.nodeTemplate?.providerDisplay;
}

export function _getNodes(resource, getters, rootGetters) {
  const nodePoolName = resource.id.replace('/', ':');

  return getters.all(MANAGEMENT.NODE).filter(node => node.spec.nodePoolName === nodePoolName);
}

export const calculatedFields = [
  { name: 'nodeTemplate', func: _getNodeTemplate },
  { name: 'providerDisplay', func: _getProviderDisplay },
  { name: 'nodes', func: _getNodes }
];
