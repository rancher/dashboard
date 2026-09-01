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

/**
 * Detect and resolve conflicts from a 409 response.
 *
 * @param {*} initialValue the initial value before changes
 * @param {*} userValue the value containing the local changes. this function will intentionally mutate this to contain changes made from the server
 * @param {*} serverValue the very latest value from the server
 * @returns If `value` has been successfully updated return a false-y value. Else they can't be resolved, return an array of errors to show the user.
 */
export async function handleConflict(initialValue, userValue, serverValue, store, storeNamespace, toJSON = (x) => x.toJSON()) {
  // initial value
  const initial = await store.dispatch(`${ storeNamespace }/cleanForDiff`, toJSON(initialValue), { root: true });
  // changed value (user edits)
  const user = await store.dispatch(`${ storeNamespace }/cleanForDiff`, toJSON(userValue), { root: true });
  // server value
  const server = await store.dispatch(`${ storeNamespace }/cleanForDiff`, toJSON(serverValue), { root: true });

  // changes made to the server value
  const serverChanges = changeset(initial, server);
  // changes made locally
  const userChanges = changeset(initial, user);
  // Any incompatibilities between changes made locally and the server?
  const actualConflicts = changesetConflicts(serverChanges, userChanges);

  console.log('Background Change', serverChanges); // eslint-disable-line no-console
  console.log('User Change', userChanges); // eslint-disable-line no-console
  console.log('Conflicts', actualConflicts); // eslint-disable-line no-console

  userValue.metadata.resourceVersion = serverValue.metadata.resourceVersion;
  // Apply changes made on the server to the changed (user) value
  applyChangeset(userValue, serverChanges);

  if ( actualConflicts.length ) {
    // Stop the save and let the user inspect and continue editing
    const out = [store.getters['i18n/t']('validation.conflict', { fields: actualConflicts.join(', '), fieldCount: actualConflicts.length })];

    return out;
  } else {
    // The save can continue
    return false;
  }
}
