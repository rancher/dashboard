import { MANAGEMENT } from '@shell/config/types';

export function _getPrincipalId(resource) {
  return resource.userPrincipalId || resource.groupPrincipalId;
}

export function _getRoleDisplay(resource) {
  return resource.roleTemplate?.nameDisplay;
}

export function _getRoleDescription(resource) {
  return resource.roleTemplate?.description;
}

export function _getRoleTemplate(resource, _, rootGetters) {
  return rootGetters['management/byId'](MANAGEMENT.ROLE_TEMPLATE, resource.roleTemplateId);
}

export const calculatedFields = [
  { name: 'principalId', func: _getPrincipalId },
  { name: 'roleDisplay', func: _getRoleDisplay },
  { name: 'roleDescription', func: _getRoleDescription },
  { name: 'roleTemplate', func: _getRoleTemplate },
];
