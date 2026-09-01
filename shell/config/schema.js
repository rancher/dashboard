import { SCHEMA } from '@shell/config/types';

export const COLLECTION_TYPES = {
  array: 'array',
  map:   'map',
};

export const PRIMITIVE_TYPES = {
  string:    'string',
  multiline: 'multiline',
  masked:    'masked',
  password:  'password',
  float:     'float',
  int:       'int',
  date:      'date',
  blob:      'blob',
  boolean:   'boolean',
  json:      'json',
  version:   'version',
};

export const PROTOCOLS = ['http', 'https'];

export const WORKLOAD_SCHEMA = {
  id:         'workload',
  type:       SCHEMA,
  attributes: {
    kind:       'Workload',
    namespaced: true
  },
  metadata: { name: 'workload' },
};
