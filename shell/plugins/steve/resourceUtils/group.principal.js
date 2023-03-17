import { NORMAN } from '@shell/config/types';

export function _getPrincipalNameDisplay(resource, { rancherById }) {
  const principal = rancherById(NORMAN.PRINCIPAL, resource.id);

  return `${ principal.name } (${ principal.displayType })`;
}

export function _getNameDisplay(resource) {
  return resource.principalNameDisplay;
}

export const calculatedFields = [
  {
    name: 'principalNameDisplay', func: _getPrincipalNameDisplay, tempCache: ['rancher']
  },
  { name: 'nameDisplay', func: _getNameDisplay }
];
