import { NORMAN } from '@shell/config/types';

export function _getPrincipalNameDisplay(resource, _, rootGetters) {
  const principal = rootGetters.rancherById(NORMAN.PRINCIPAL, resource.id);

  return `${ principal.name } (${ principal.displayType })`;
}

export function _getNameDisplay(resource) {
  return resource.principalNameDisplay;
}

export const calculatedFields = [
  {
    name: 'principalNameDisplay', func: _getPrincipalNameDisplay, caches: ['rancher']
  },
  { name: 'nameDisplay', func: _getNameDisplay }
];
