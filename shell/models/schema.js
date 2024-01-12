import Resource from '@shell/plugins/dashboard-store/resource-class';

export default class Schema extends Resource {
  get groupName() {
    return this.attributes.namespaced ? 'ns' : 'cluster';
  }
}

/**
 * Handles
 * - no subtype { type: 'string' }
 * - traditional map/array's with sub type in type e.g `{ type: array[string] }`
 * - new schema definitions map/array's with sub type property e.g. `{ type: 'array', subtype: 'string' }`
 */
const mapArrayTypeRegex = /([\w]*)(\[([\w]*)\])?/;

export function parseType(str, field) {
  // TODO: RC test
  // TODO: RC unit test
  debugger;
  const regexRes = mapArrayTypeRegex.exec(str);
  const subtype = regexRes[2] || field?.subtype;
  const res = regexRes[0];

  if (subtype) {
    res.push(subtype);
  }

  return res;
}
// export function parseType(str, field) {
//   if ( str.startsWith('array[') ) {
//     return ['array', ...parseType(str.slice(6, -1))];
//   } else if (str.startsWith('array')) {
//     return ['array', field.subtype]; // schemaDefinition
//   } else if ( str.startsWith('map[') ) {
//     return ['map', ...parseType(str.slice(4, -1))];
//   } else if (str.startsWith('map')) {
//     return ['map', field.subtype]; // schemaDefinition
//   } else {
//     return [str];
//   }
// }
