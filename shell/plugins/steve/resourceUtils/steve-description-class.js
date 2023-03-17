export function _getDescription(resource) {
  return resource.data.description;
}

export const calculatedFields = [
  { name: 'description', func: _getDescription }
];
