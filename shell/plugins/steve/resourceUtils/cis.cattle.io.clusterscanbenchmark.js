import { CATALOG } from '@shell/config/types';

export function _getIsDefault(resource) {
  const { relationships = [] } = resource.metadata;

  if (!relationships) {
    return false;
  }

  return relationships.filter(rel => rel.fromType === CATALOG.APP ).length > 0;
}

export const calculatedFields = [
  { name: 'isDefault', func: _getIsDefault }
];
