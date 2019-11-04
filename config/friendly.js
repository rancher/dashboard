import { CONFIG_MAP, SECRET, RIO } from '@/config/types';
import {
  STATE, NAME, NAMESPACE_NAME, AGE,
  RIO_IMAGE, WEIGHT, SCALE,
  KEYS,
  TARGET, TARGET_KIND, TARGET_SECRET,
} from '@/config/table-headers';

export const FRIENDLY = {
  'config-maps': {
    singular: 'Config Map',
    plural:   'Config Maps',
    type:     CONFIG_MAP,
    headers:  [
      STATE,
      NAMESPACE_NAME,
      KEYS,
      AGE
    ],
  },
  'external-services': {
    singular: 'External Service',
    plural:   'External Services',
    type:     RIO.EXTERNAL_SERVICE,
    headers:  [
      STATE,
      NAMESPACE_NAME,
      TARGET_KIND,
      TARGET,
      AGE,
    ],
  },

  'public-domains': {
    singular: 'Public Domain',
    plural:   'Public Domains',
    type:     RIO.PUBLIC_DOMAIN,
    headers:  [
      STATE,
      NAME,
      TARGET_KIND,
      TARGET,
      TARGET_SECRET,
      AGE,
    ],
  },

  services: {
    singular: 'Service',
    plural:   'Services',
    type:     RIO.SERVICE,
    headers:  [
      STATE,
      NAMESPACE_NAME,
      RIO_IMAGE,
      WEIGHT,
      SCALE,
      AGE,
    ]
  },

  stack: {
    singular: 'Stack',
    plural:   'Stacks',
    type:     RIO.STACK
  },

  routers: {
    singular: 'Router',
    plural:   'Routers',
    type:     RIO.ROUTER
  },

  secrets: {
    singular: 'Secret',
    plural:   'Secrets',
    type:     SECRET,
    headers:  [
      STATE,
      NAMESPACE_NAME,
      {
        name:  'type',
        label: 'Type',
        value: 'typeDisplay',
      },
      KEYS,
      AGE
    ],
  },
};

export const TO_FRIENDLY = {};
Object.keys(FRIENDLY).forEach((key) => {
  const entry = FRIENDLY[key];

  entry.resource = key;

  TO_FRIENDLY[entry.type] = entry;
});
