import { shortenedImage, escapeHtml } from '@shell/utils/string';

export function _getGroupByNode(resource, _, rootGetters) {
  const name = resource.spec?.nodeName || rootGetters['i18n/translate']('generic.none');

  return rootGetters['i18n/translate']('resourceTable.groupLabel.node', { name: escapeHtml(name) });
}

export function _getIsRunning(resource) {
  return resource.status.phase === 'Running';
}

export function _getImageNames(resource) {
  return resource.spec.containers.map(container => shortenedImage(container.image));
}

export function _getRestartCount(resource) {
  if (resource.status?.containerStatuses) {
    return resource.status?.containerStatuses[0].restartCount || 0;
  }

  return 0;
}

export const calculatedFields = [
  { name: 'groupByNode', func: _getGroupByNode },
  { name: 'isRunning', func: _getIsRunning },
  { name: 'imageNames', func: _getImageNames },
  { name: 'restartCount', func: _getRestartCount },
];
