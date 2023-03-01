import { normalizeType } from '@shell/plugins/dashboard-store/normalize';

/**
 * Returns _id special field without mutating the function input
 */
export function _getSchemaId(schema) {
  return normalizeType(schema.id);
}

/**
 * Returns _group special field without mutating the function input
 */
export function _getSchemaGroup(schema) {
  return normalizeType(schema.attributes?.group);
}

export function _testFunc(schema) {
  return 'bob';
}

/**
 * Inject special fields for indexing schemas
 *
 * Note
 * This mutates input in a function, which is bad...
 * but ensures the reference isn't broken, which is needed to maintain similar functionality as before
 */
export function addSchemaIndexFields(schema) {
  schema._id = _getSchemaId(schema);
  schema._group = _getSchemaGroup(schema);
}

/**
 * Remove special fields for indexing schemas
 *
 * Note
 * This mutates input in a function, which is bad...
 * but ensures the reference isn't broken, which is needed to maintain similar functionality as before
 */
export function removeSchemaIndexFields(schema) {
  delete schema._id;
  delete schema._group;
}
