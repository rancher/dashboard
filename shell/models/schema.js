import Resource from '@shell/plugins/dashboard-store/resource-class';
import { normalizeType } from '@shell/plugins/dashboard-store/normalize';

export default class Schema extends Resource {
  get groupName() {
    return this.attributes.namespaced ? 'ns' : 'cluster';
  }
}

export function addSchemaIndexFields(data) {
  return {
    ...data,
    _id:    normalizeType(data.id),
    _group: normalizeType(data.attributes?.group)
  };
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
