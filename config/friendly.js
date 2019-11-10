import { CONFIG_MAP, SECRET, RIO } from '@/config/types';
import {
  STATE, NAME, NAMESPACE_NAME, AGE,
  RIO_IMAGE, WEIGHT, SCALE,
  KEYS, ENDPOINTS,
  TARGET, TARGET_KIND,
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
      {
        name:   'secret-name',
        label:  'Secret',
        value:  'status.assignedSecretName',
        sort:   ['secretName', 'targetApp', 'targetVersion'],
      },
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
      ENDPOINTS,
      WEIGHT,
      SCALE,
      AGE,
    ]
  },

  stack: {
    singular:  'Stack',
    plural:    'Stacks',
    hasDetail: true,
    type:      RIO.STACK,
    headers:   [
      STATE,
      NAMESPACE_NAME,
      {
        name:  'repo',
        label: 'Repo',
        value: 'repoDisplay',
        sort:  'repoDisplay',
      },
      {
        name:  'branch',
        label: 'Branch',
        value: 'branchDisplay',
        sort:  'branchDisplay',
      },
      AGE,
    ],
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
        sort:  ['typeDisplay', 'nameSort'],
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
