import { FLEET as FLEET_LABELS } from '@shell/config/labels-annotations';
import { escapeHtml } from '@shell/utils/string';

export function _getGroupByLabel(resource, { translate }) {
  const name = resource.metadata.namespace;

  if ( name ) {
    return translate('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
  } else {
    return translate('resourceTable.groupLabel.notInAWorkspace');
  }
}

export function _getNameDisplay(resource) {
  return resource.metadata?.labels?.[FLEET_LABELS.CLUSTER_DISPLAY_NAME] ||
        resource.metadata?.name ||
        resource.id;
}

export const calculatedFields = [
  { name: 'groupByLabel', func: _getGroupByLabel },
  { name: 'nameDisplay', func: _getNameDisplay }
];
