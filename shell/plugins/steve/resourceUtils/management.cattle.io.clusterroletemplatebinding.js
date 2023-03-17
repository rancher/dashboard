import { MANAGEMENT } from '@shell/config/types';

export function _getPrincipalId(resource) {
  // We've either set it ourselves or it's comes from native properties
  return resource.principalName || resource.userPrincipalName || resource.groupPrincipalName;
}

export function _getUser(resource, { mgmtById }) {
  return mgmtById(MANAGEMENT.USER, resource.userName);
}

export function _getNameDisplay(resource) {
  return resource.user?.nameDisplay || resource.userName || resource.principalId;
}

export const calculatedFields = [
  { name: 'principalId', func: _getPrincipalId },
  {
    name: 'user', func: _getUser, tempCache: ['management']
  },
  { name: 'nameDisplay', func: _getNameDisplay },
];
