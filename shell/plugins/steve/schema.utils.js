import { normalizeType } from '@shell/plugins/dashboard-store/normalize';

/**
 * Returns _id special field without mutating the function input
 */
export function _id(schema) {
  return normalizeType(schema.id);
}

export function functionTest() {
  return 'blerb';
}

/**
 * Returns _group special field without mutating the function input
 */
export function _group(schema) {
  return normalizeType(schema.attributes?.group);
}

/**
 * Inject special fields for indexing schemas
 *
 * Note
 * This mutates input in a function, which is bad...
 * but ensures the reference isn't broken, which is needed to maintain similar functionality as before
 */
export function addSchemaIndexFields(schema) {
  schema._id = normalizeType(schema.id);
  schema._group = normalizeType(schema.attributes?.group);
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
