export function _getName(resource) {
  return resource.spec?.plugin?.name;
}

export function _getDescription(resource) {
  return resource.spec?.plugin?.description;
}

export function _getVersion(resource) {
  return resource.spec?.plugin?.version;
}

export const calculatedFields = [
  { name: 'name', func: _getName },
  { name: 'description', func: _getDescription },
  { name: 'version', func: _getVersion },
];
