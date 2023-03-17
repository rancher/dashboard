import { MANAGEMENT, NORMAN } from '@shell/config/types';

export function _getDisplayPrincipal(resource, { rancherById }) {
  const principal = rancherById(NORMAN.PRINCIPAL, resource.groupPrincipalName);

  return principal ? `${ principal.name } - ${ principal.displayType }` : null;
}

export function _getNameDisplay(resource, { byId }) {
  const role = byId(MANAGEMENT.GLOBAL_ROLE, resource.globalRoleName);

  if (!role) {
    return resource.globalRoleName;
  }

  const ownersName = resource.groupPrincipalName ? resource._displayPrincipal : resource._displayUser;

  return ownersName ? `${ role.displayName } (${ ownersName })` : role.displayName;
}

export const calculatedFields = [
  {
    name: 'displayPrincipal', func: _getDisplayPrincipal, tempCache: ['rancher']
  },
  { name: 'nameDisplay', func: _getNameDisplay }
];
