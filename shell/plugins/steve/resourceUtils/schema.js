import { normalizeType } from '@shell/plugins/dashboard-store/normalize';
import { splitObjectPath } from '@shell/utils/string';

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

// recursive function that'll peel back arrays and maps until it finds a string
export function parseType(str) {
  if ( str.startsWith('array[') ) {
    return ['array', ...parseType(str.slice(6, -1))];
  } else if ( str.startsWith('map[') ) {
    return ['map', ...parseType(str.slice(4, -1))];
  } else {
    return [str];
  }
}

export function pathExistsInSchema(startingSchema, path, schemaFor) {
  let schema = startingSchema;
  const parts = splitObjectPath(path);
  let type;

  while ( parts.length ) {
    const key = parts.shift();

    type = schema.resourceFields?.[key]?.type;

    if ( !type ) {
      return false;
    }

    if ( parts.length ) {
      // last element in the array returned by parseType should be a type-string and not an array or map
      type = parseType(type).pop(); // Get the main part of array[map[something]] => something
      schema = schemaFor(type);

      if ( !schema ) {
        return false;
      }
    }
  }

  return true;
}

export const calculatedFields = [];
