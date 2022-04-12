import Resource from '@shell//plugins/core-store/resource-class';

export default class Schema extends Resource {
  get groupName() {
    return this.attributes.namespaced ? 'ns' : 'cluster';
  }
}

export function parseType(str) {
  if ( str.startsWith('array[') ) {
    return ['array', ...parseType(str.slice(6, -1))];
  } else if ( str.startsWith('map[') ) {
    return ['map', ...parseType(str.slice(4, -1))];
  } else {
    return [str];
  }
}
