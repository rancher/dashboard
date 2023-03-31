import { escapeHtml } from '@shell/utils/string';

export function _getGroupByLabel(resource, _, rootGetters) {
  const name = resource.metadata.namespace;

  if ( name ) {
    return rootGetters['i18n/translate']('resourceTable.groupLabel.workspace', { name: escapeHtml(name) });
  } else {
    return rootGetters['i18n/translate']('resourceTable.groupLabel.notInAWorkspace');
  }
}

export const calculatedFields = [
  { name: 'groupByLabel', func: _getGroupByLabel }
];
