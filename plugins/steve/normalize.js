import { SCHEMA } from '@/config/types';
import isObject from 'lodash/isObject';

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
