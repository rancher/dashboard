import Resource from '@shell/plugins/dashboard-store/resource-class';

/**
 * For types see schema.d.ts
 */
export default class Schema extends Resource {
  get groupName() {
    return this.attributes.namespaced ? 'ns' : 'cluster';
  }
}

/**
 * Handles
 * - no subtype { type: 'io.cattle.provisioning.v1.Cluster.status' }
 * - traditional map/array's with sub type in type e.g `{ type: array[io.cattle.provisioning.v1.Cluster.status] }`
 * - new schema definitions map/array's with sub type property e.g. `{ type: 'array', subtype: 'io.cattle.provisioning.v1.Cluster.status' }`
 */
const mapArrayTypeRegex = /([^[\s]*)(\[(.*)\])?/;

/**
 * For the given resourceField find the root type and, if a collection of types, it's subtype
 *
 * @param {String} str type, may contain sub type
 * @param {ResourceField} field resourceField entry, may contain sub type
 * @returns [type, subtype]
 */
export function parseType(str, field) {
  const regexRes = mapArrayTypeRegex.exec(str);

  const subtype = regexRes[3] || field?.subtype;
  const res = [regexRes[1]];

  if (subtype) {
    res.push(subtype);
  }

  return res;
}
