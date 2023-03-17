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

export function _getGroupByPoolLabel(resource, { translate }) {
  const name = resource.cluster?.nameDisplay || resource.spec.clusterName;

  return translate('resourceTable.groupLabel.cluster', { name: escapeHtml(name) });
}

export function _getGroupByPoolShortLabel(resource, { translate }) {
  const name = resource.cluster?.nameDisplay || resource.spec.clusterName;

  return translate('resourceTable.groupLabel.cluster', { name: escapeHtml(name) });
}

export function _getTemplateType(resource) {
  return resource.spec.template.spec.infrastructureRef.kind ? `rke-machine.cattle.io.${ resource.spec.template.spec.infrastructureRef.kind.toLowerCase() }` : null;
}

export function _getTemplate(resource, { mgmtById }) {
  const ref = resource.spec.template.spec.infrastructureRef;
  const id = `${ ref.namespace }/${ ref.name }`;
  const template = mgmtById(resource.templateType, id);

  return template;
}

export function _getProviderDisplay(resource, { translateWithFallback }) {
  const provider = (resource.template?.provider || '').toLowerCase();

  return translateWithFallback(`cluster.provider."${ provider }"`, null, 'generic.unknown', true);
}

export const calculatedFields = [
  {
    name: 'cluster', func: _getCluster, tempCache: ['management']
  },
  { name: 'groupByLabel', func: _getGroupByLabel },
  { name: 'groupByPoolLabel', func: _getGroupByPoolLabel },
  { name: 'groupByPoolShortLabel', func: _getGroupByPoolShortLabel },
  { name: 'templateType', func: _getTemplateType },
  { name: 'template', func: _getTemplate },
  { name: 'providerDisplay', func: _getProviderDisplay }
];
