export function _getNameDisplay(resource) {
  return resource.name;
}

export const calculatedFields = [
  { name: 'nameDisplay', func: _getNameDisplay }
];
