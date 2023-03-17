import { MANAGEMENT } from '@shell/config/types';
import { escapeHtml } from '@shell/utils/string';
import { PROJECT } from '@shell/config/labels-annotations';

export function _getProjectId(resource) {
  const projectAnnotation = resource.metadata?.annotations?.[PROJECT] || '';

  return projectAnnotation.split(':')[1] || null;
}

export function _getProject(resource, { mgmtById, currentCluster, isRancher }) {
  if ( !resource.projectId || !isRancher ) {
    return null;
  }

  const clusterId = currentCluster?.id;
  const project = mgmtById(MANAGEMENT.PROJECT, `${ clusterId }/${ resource.projectId }`);

  return project;
}

export function _getProjectNameSort(resource) {
  return resource.project?.nameSort || '';
}

export function _getGroupByLabel(resource, { translate }) {
  const name = resource.project?.nameDisplay;

  if ( name ) {
    return translate('resourceTable.groupLabel.project', { name: escapeHtml(name) });
  } else {
    return translate('resourceTable.groupLabel.notInAProject');
  }
}

export const calculatedFields = [
  { name: 'projectId', func: _getProjectId },
  {
    name: 'project', func: _getProject, tempCache: ['management'], cache: ['root']
  },
  { name: 'projectNameSort', func: _getProjectNameSort },
  { name: 'groupByLabel', func: _getGroupByLabel }
];
