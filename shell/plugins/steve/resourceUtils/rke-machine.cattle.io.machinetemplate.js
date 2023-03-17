export function _getNameDisplay(resource) {
  return resource.name.replace(`${ resource.metadata.annotations['objectset.rio.cattle.io/owner-name'] }-`, '');
}

export const calculatedFields = [
  { name: 'nameDisplay', func: _getNameDisplay }
];
