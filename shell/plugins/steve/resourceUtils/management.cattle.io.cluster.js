import { MANAGEMENT } from '@shell/config/types';

export function _getGroupByLabel(_, rootGetters) {
  return rootGetters['i18n/translate']('resourceTable.groupLabel.notInAWorkspace');
}

export function _getKubernetesVersion(resource, _, rootGetters) {
  return resource.kubernetesVersionRaw || rootGetters['i18n/translate']('generic.provisioning');
}

export function _getMachineProvider(resource) {
  const kind = resource.machinePools?.[0]?.provider;

  if ( kind ) {
    return kind.replace(/config$/i, '').toLowerCase();
  } else if ( resource.spec?.internal ) {
    return 'local';
  }

  return null;
}

export function _getNodes(resource, getters, rootGetters) {
  return getters.all(MANAGEMENT.NODE).filter(node => node.id.startsWith(resource.id));
}

export const calculatedFields = [
  { name: 'groupByLabel', func: _getGroupByLabel },
  { name: 'kubernetesVersion', func: _getKubernetesVersion },
  { name: 'machineProvider', func: _getMachineProvider },
  {
    name: 'nodes', func: _getNodes, caches: ['management']
  }
];
