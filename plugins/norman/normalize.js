import { SCHEMA } from '@/utils/types';

export const KEY_FIELD_FOR = {
  [SCHEMA]:  '_id',
  default:  'id',
};

export function normalizeType(type) {
  type = (type || '').toLowerCase();

  return type;
}
