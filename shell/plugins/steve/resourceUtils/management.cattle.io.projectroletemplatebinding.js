import { MANAGEMENT } from '@shell/config/types';

export function _getUser(resource, { mgmtById }) {
  return mgmtById(MANAGEMENT.USER, resource.userName);
}

export function _getNameDisplay(resource) {
  return resource.user?.nameDisplay;
}

export function _getClusterId(resource) {
  // projectName is in format `local:p-v679w`,
  return resource.projectName.substring(0, resource.projectName.lastIndexOf(':'));
}

export const calculatedFields = [
  {
    name: 'user', func: _getUser, tempCache: ['management']
  },
  { name: 'nameDisplay', func: _getNameDisplay },
  { name: 'clusterId', func: _getClusterId },
];
