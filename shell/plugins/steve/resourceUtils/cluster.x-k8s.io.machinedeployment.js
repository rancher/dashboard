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

export function _getGroupByPoolLabel(resource, _, rootGetters) {
  const name = resource.cluster?.nameDisplay || resource.spec.clusterName;

  return rootGetters['i18n/translate']('resourceTable.groupLabel.cluster', { name: escapeHtml(name) });
}

export function _getGroupByPoolShortLabel(resource, _, rootGetters) {
  const name = resource.cluster?.nameDisplay || resource.spec.clusterName;

  return rootGetters['i18n/translate']('resourceTable.groupLabel.cluster', { name: escapeHtml(name) });
}

export function _getTemplateType(resource) {
  return resource.spec.template.spec.infrastructureRef.kind ? `rke-machine.cattle.io.${ resource.spec.template.spec.infrastructureRef.kind.toLowerCase() }` : null;
}

export function _getTemplate(resource, getters, rootGetters) {
  const ref = resource.spec.template.spec.infrastructureRef;
  const id = `${ ref.namespace }/${ ref.name }`;
  const template = rootGetters['management/byId'](resource.templateType, id);

  return template;
}

export function _getProviderDisplay(resource, _, rootGetters) {
  const provider = (resource.template?.provider || '').toLowerCase();

  return rootGetters['i18n/translateWithFallback'](`cluster.provider."${ provider }"`, null, 'generic.unknown', true);
}

export const calculatedFields = [
  {
    name: 'cluster', func: _getCluster, caches: ['management']
  },
  { name: 'groupByLabel', func: _getGroupByLabel },
  { name: 'groupByPoolLabel', func: _getGroupByPoolLabel },
  { name: 'groupByPoolShortLabel', func: _getGroupByPoolShortLabel },
  { name: 'templateType', func: _getTemplateType },
  { name: 'template', func: _getTemplate },
  { name: 'providerDisplay', func: _getProviderDisplay }
];
