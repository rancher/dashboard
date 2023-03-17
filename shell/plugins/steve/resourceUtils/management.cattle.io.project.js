import { DEFAULT_PROJECT } from '@shell/config/labels-annotations';

export function _getIsDefault(resource) {
  return resource.metadata?.labels?.[DEFAULT_PROJECT] === 'true';
}

export const calculatedFields = [
  { name: 'isDefault', func: _getIsDefault }
];
