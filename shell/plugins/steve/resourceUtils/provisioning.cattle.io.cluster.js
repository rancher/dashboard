import { _getCreationTimestamp as resourceGetCreationTimestamp } from '@shell/plugins/steve/resourceUtils/resource-class';
import { MANAGEMENT } from '@shell/config/types';

export function _getIsRke2(resource) {
  return !!resource.spec?.rkeConfig;
}

export function _getMgmt(resource, getters, rootGetters) {
  const name = resource.status?.clusterName;

  if ( !name ) {
    return null;
  }

  const out = rootGetters['management/byId'](MANAGEMENT.CLUSTER, name);

  return out;
}

export function _getProvisioner(resource) {
  if ( resource.isRke2 ) {
    const allKeys = Object.keys(resource.spec);
    const configKey = allKeys.find( k => k.endsWith('Config'));

    if ( configKey === 'rkeConfig') {
      return 'rke2';
    } else if ( configKey ) {
      return configKey.replace(/config$/i, '');
    }
  } else if ( resource.mgmt ) {
    return resource.mgmt.provisioner;
  }

  return null;
}

export function _getIsImported(resource) {
  // As of Rancher v2.6.7, this returns false for imported K3s clusters,
  // in which resource.provisioner is `k3s`.
  return resource.provisioner === 'imported';
}

export function _getMgmtClusterId(resource) {
  return resource.mgmt?.id || resource.id?.replace(`${ resource.metadata.namespace }/`, '');
}

export function _getCreationTimestamp(resource) {
  const provCreationTimestamp = Date.parse(resource.metadata?.creationTimestamp);
  const mgmtCreationTimestamp = Date.parse(resource.mgmt?.metadata?.creationTimestamp);

  if (mgmtCreationTimestamp && mgmtCreationTimestamp < provCreationTimestamp) {
    return resource.mgmt?.metadata?.creationTimestamp;
  }

  return resourceGetCreationTimestamp(resource);
}

export function _getKubernetesVersion(resource, _, rootGetters) {
  const unknown = rootGetters['i18n/translate']('generic.unknown');

  if ( resource.isRke2 ) {
    const fromStatus = resource.status?.version?.gitVersion;
    const fromSpec = resource.spec?.kubernetesVersion;

    return fromStatus || fromSpec || unknown;
  } else if ( resource.mgmt ) {
    return resource.mgmt.kubernetesVersion || unknown;
  } else {
    return unknown;
  }
}

export function _getMachineProvider(resource) {
  if ( resource.isImported ) {
    return null;
  } else if ( resource.isRke2 ) {
    const kind = resource.spec?.rkeConfig?.machinePools?.[0]?.machineConfigRef?.kind?.toLowerCase();

    if ( kind ) {
      return kind.replace(/config$/i, '').toLowerCase();
    }

    return null;
  } else if ( resource.mgmt?.machineProvider ) {
    return resource.mgmt.machineProvider.toLowerCase();
  }

  return null;
}

export function _getNodes(resource, getters, rootGetters) {
  return rootGetters['management/all'](MANAGEMENT.NODE).filter(node => node.id.startsWith(resource.mgmtClusterId));
}

export const calculatedFields = [
  { name: 'isRke2', func: _getIsRke2 },
  {
    name: 'mgmt', func: _getMgmt, caches: ['management']
  },
  { name: 'provisioner', func: _getProvisioner },
  { name: 'isImported', func: _getIsImported },
  { name: 'mgmtClusterId', func: _getMgmtClusterId },
  { name: 'creationTimestamp', func: _getCreationTimestamp },
  { name: 'kubernetesVersion', func: _getKubernetesVersion },
  { name: 'machineProvider', func: _getMachineProvider },
  {
    name: 'nodes', func: _getNodes, caches: ['management']
  }
];
