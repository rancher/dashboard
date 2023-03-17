import { escapeHtml } from '@shell/utils/string';

export function _getGroupByLabel(resource, { translate }) {
  const name = resource.metadata.namespace;

  if ( name ) {
    return translate('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
  } else {
    return translate('resourceTable.groupLabel.notInAWorkspace');
  }
}

export const calculatedFields = [
  { name: 'groupByLabel', func: _getGroupByLabel }
];
