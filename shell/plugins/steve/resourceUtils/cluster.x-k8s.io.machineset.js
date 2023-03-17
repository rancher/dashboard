import { CAPI } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';

export function _getCluster(resource, { mgmtById }) {
  if ( !resource.spec.clusterName ) {
    return null;
  }

  const clusterId = `${ resource.metadata.namespace }/${ resource.spec.clusterName }`;

  const cluster = mgmtById(CAPI.RANCHER_CLUSTER, clusterId);

  return cluster;
}

export function _getGroupByLabel(resource, { translate }) {
  const name = resource.cluster?.nameDisplay || resource.spec.clusterName;

  return translate('resourceTable.groupLabel.cluster', { name: escapeHtml(name) });
}

export const calculatedFields = [
  {
    name: 'cluster', func: _getCluster, tempCache: ['management']
  },
  { name: 'groupByLabel', func: _getGroupByLabel }
];
