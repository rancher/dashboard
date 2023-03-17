export function _getNameDisplay(resource, { translateWithFallback }) {
  const name = resource.metadata?.name;
  const key = `catalog.repo.name."${ name }"`;

  return translateWithFallback(key, null, name);
}

export function _getTypeDisplay(resource) {
  if ( resource.spec.gitRepo ) {
    return 'git';
  } else if ( resource.spec.url ) {
    return 'http';
  } else {
    return '?';
  }
}

export function _getUrlDisplay(resource) {
  return resource.status?.url || resource.spec.gitRepo || resource.spec.url;
}

export const calculatedFields = [
  { name: 'nameDisplay', func: _getNameDisplay },
  { name: 'typeDisplay', func: _getTypeDisplay },
  { name: 'urlDisplay', func: _getUrlDisplay },
];
