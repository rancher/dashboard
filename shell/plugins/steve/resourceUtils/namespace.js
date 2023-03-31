import { MANAGEMENT } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';
import { PROJECT } from '@shell/config/labels-annotations';

export function _getProjectId(resource) {
  const projectAnnotation = resource.metadata?.annotations?.[PROJECT] || '';

  return projectAnnotation.split(':')[1] || null;
}

export function _getProject(resource, _, rootGetters) {
  if ( !resource.projectId || !rootGetters.isRancher ) {
    return null;
  }

  const clusterId = rootGetters.cluster.id;
  const project = rootGetters['management/byId'](MANAGEMENT.PROJECT, `${ clusterId }/${ resource.projectId }`);

  return project;
}

export function _getProjectNameSort(resource) {
  return resource.project?.nameSort || '';
}

export function _getGroupByLabel(resource, _, rootGetters) {
  const name = resource.project?.nameDisplay;

  if ( name ) {
    return rootGetters['i18n/translate']('resourceTable.groupLabel.project', { name: escapeHtml(name) });
  } else {
    return rootGetters['i18n/translate']('resourceTable.groupLabel.notInAProject');
  }
}

export const calculatedFields = [
  { name: 'projectId', func: _getProjectId },
  {
    name: 'project', func: _getProject, caches: ['management', 'root']
  },
  { name: 'projectNameSort', func: _getProjectNameSort },
  { name: 'groupByLabel', func: _getGroupByLabel }
];
