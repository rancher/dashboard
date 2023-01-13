import { normalizeType } from '@shell/plugins/dashboard-store/normalize';

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
