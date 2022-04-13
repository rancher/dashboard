import { SCHEMA } from '@shell/config/types';
import isObject from 'lodash/isObject';
import { applyChangeset, changeset, changesetConflicts } from '~shell/utils/object';

export const KEY_FIELD_FOR = {
  [SCHEMA]:  '_id',
  default:  'id',
};

export function keyFieldFor(type) {
  return KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
}

export function normalizeType(type) {
  type = (type?.type || type || '').toLowerCase();

  return type;
}

const diffRootKeys = [
  'actions', 'links', 'status', '__rehydrate', '__clone'
];

const diffMetadataKeys = [
  'ownerReferences',
  'selfLink',
  'creationTimestamp',
  'deletionTimestamp',
  'state',
  'fields',
  'relationships',
  'generation',
  'managedFields',
  'resourceVersion',
];

const newRootKeys = [
  'actions', 'links', 'status', 'id'
];

const newMetadataKeys = [
  ...diffMetadataKeys,
  'uid',
];

export function cleanForNew(obj) {
  const m = obj.metadata || {};

  dropKeys(obj, newRootKeys);
  dropKeys(m, newMetadataKeys);
  dropCattleKeys(m.annotations);
  dropCattleKeys(m.labels);

  m.name = '';

  if ( obj?.spec?.crd?.spec?.names?.kind ) {
    obj.spec.crd.spec.names.kind = '';
  }

  return obj;
}

export function cleanForDiff(obj) {
  const m = obj.metadata || {};

  if ( !m.labels ) {
    m.labels = {};
  }

  if ( !m.annotations ) {
    m.annotations = {};
  }

  dropUnderscores(obj);
  dropKeys(obj, diffRootKeys);
  dropKeys(m, diffMetadataKeys);
  dropCattleKeys(m.annotations);
  dropCattleKeys(m.labels);

  return obj;
}

function dropUnderscores(obj) {
  for ( const k in obj ) {
    if ( k.startsWith('__') ) {
      delete obj[k];
    } else {
      const v = obj[k];

      if ( isObject(v) ) {
        dropUnderscores(v);
      }
    }
  }
}

function dropKeys(obj, keys) {
  if ( !obj ) {
    return;
  }

  for ( const k of keys ) {
    delete obj[k];
  }
}

function dropCattleKeys(obj) {
  if ( !obj ) {
    return;
  }

  Object.keys(obj).forEach((key) => {
    if ( !!key.match(/(^|field\.)cattle\.io(\/.*|$)/) ) {
      delete obj[key];
    }
  });
}

// Detect and resolve conflicts from a 409 response.
// If they are resolved, return a false-y value
// Else they can't be resolved, return an array of errors to show to the user.
export function handleConflict(initialValueJSON, value, liveValue, rootGetters) {
  const orig = cleanForDiff(initialValueJSON);
  const user = cleanForDiff(value.toJSON());
  const cur = cleanForDiff(liveValue.toJSON());

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
