import { CAPI } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';

export function _getCluster(resource, getters, rootGetters) {
  if ( !resource.spec.clusterName ) {
    return null;
  }

  const clusterId = `${ resource.metadata.namespace }/${ resource.spec.clusterName }`;

  const cluster = rootGetters['management/byId'](CAPI.RANCHER_CLUSTER, clusterId);

  return cluster;
}

export function _getGroupByLabel(resource, _, rootGetters) {
  const name = resource.cluster?.nameDisplay || resource.spec.clusterName;

  return rootGetters['i18n/translate']('resourceTable.groupLabel.cluster', { name: escapeHtml(name) });
}

export const calculatedFields = [
  {
    name: 'cluster', func: _getCluster, caches: ['management']
  },
  { name: 'groupByLabel', func: _getGroupByLabel }
];
