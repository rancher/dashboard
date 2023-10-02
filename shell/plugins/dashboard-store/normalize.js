import { SCHEMA } from '@shell/config/types';

import { applyChangeset, changeset, changesetConflicts } from '@shell/utils/object';

export const KEY_FIELD_FOR = {
  [SCHEMA]: '_id',
  default:  'id',
};

export function keyFieldFor(type) {
  return KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
}

export function normalizeType(type) {
  type = (type?.type || type || '').toLowerCase();

  return type;
}

// Detect and resolve conflicts from a 409 response.
// If they are resolved, return a false-y value
// Else they can't be resolved, return an array of errors to show to the user.
export async function handleConflict(initialValueJSON, value, liveValue, rootGetters, store, storeNamespace) {
  const orig = await store.dispatch(`${ storeNamespace }/cleanForDiff`, initialValueJSON, { root: true });
  const user = await store.dispatch(`${ storeNamespace }/cleanForDiff`, value.toJSON(), { root: true });
  const cur = await store.dispatch(`${ storeNamespace }/cleanForDiff`, liveValue.toJSON(), { root: true });

  const bgChange = changeset(orig, cur);
  const userChange = changeset(orig, user);
  const actualConflicts = changesetConflicts(bgChange, userChange);

  console.log('Background Change', bgChange); // eslint-disable-line no-console
  console.log('User Change', userChange); // eslint-disable-line no-console
  console.log('Conflicts', actualConflicts); // eslint-disable-line no-console

  value.metadata.resourceVersion = liveValue.metadata.resourceVersion;
  applyChangeset(value, bgChange);

  if ( actualConflicts.length ) {
    // Stop the save and let the user inspect and continue editing
    const out = [rootGetters['i18n/t']('validation.conflict', { fields: actualConflicts.join(', '), fieldCount: actualConflicts.length })];

    return out;
  } else {
    // The save can continue
    return false;
  }
}
