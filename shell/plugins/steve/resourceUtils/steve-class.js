import { DESCRIPTION } from '@shell/config/labels-annotations';

export function _getNamespace(resource) {
  return resource.metadata?.namespace;
}

export function _getName(resource) {
  return resource.metadata?.name || resource._name;
}

export function _getDescription(resource) {
  return resource.metadata?.annotations?.[DESCRIPTION] || resource.spec?.description || resource._description;
}

export const calculatedFields = [
  { name: 'namespace', func: _getNamespace },
  { name: 'name', func: _getName },
  { name: 'description', func: _getDescription }
];
