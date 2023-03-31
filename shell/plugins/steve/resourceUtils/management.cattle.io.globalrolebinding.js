import { MANAGEMENT, NORMAN } from '@shell/config/types';

export function _getDisplayPrincipal(resource, _, rootGetters) {
  const principal = rootGetters.rancherById(NORMAN.PRINCIPAL, resource.groupPrincipalName);

  return principal ? `${ principal.name } - ${ principal.displayType }` : null;
}

export function _getNameDisplay(resource, getters, rootGetters) {
  const role = getters.byId(MANAGEMENT.GLOBAL_ROLE, resource.globalRoleName);

  if (!role) {
    return resource.globalRoleName;
  }

  const ownersName = resource.groupPrincipalName ? resource._displayPrincipal : resource._displayUser;

  return ownersName ? `${ role.displayName } (${ ownersName })` : role.displayName;
}

export const calculatedFields = [
  {
    name: 'displayPrincipal', func: _getDisplayPrincipal, caches: ['rancher']
  },
  { name: 'nameDisplay', func: _getNameDisplay }
];
