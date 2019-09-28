import { SCHEMA } from '~/config/types';

export const KEY_FIELD_FOR = {
  [SCHEMA]:  '_id',
  default:  'id',
};

export function keyFieldFor(type) {
  return KEY_FIELD_FOR[type] || KEY_FIELD_FOR['default'];
}

export function normalizeType(type) {
  type = (type || '').toLowerCase();

  return type;
}
