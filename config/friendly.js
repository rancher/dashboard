import {
  CONFIG_MAP, SECRET, RIO, NAMESPACE, NODE, RBAC
} from '@/config/types';
import {
  STATE, NAME, NAMESPACE_NAME, NAMESPACE_NAME_IMAGE, AGE,
  WEIGHT, SCALE,
  KEYS, ENDPOINTS,
  MATCHES, DESTINATION,
  TARGET, TARGET_KIND, USERNAME, USER_DISPLAY_NAME, USER_ID, USER_STATUS,
  NODE_NAME, ROLES,
  VERSION, CPU,
  RAM, PODS,
  CREATED,
  BUILT_IN, CLUSTER_CREATOR_DEFAULT
} from '@/config/table-headers';

export const FRIENDLY = {
  [NAMESPACE]: {
    singular:  'Namespace',
    hasDetail: true,
    type:      NAMESPACE,
    headers:   [STATE, NAME, AGE]
  },
  'config-maps': {
    singular:  'Config Map',
    plural:    'Config Maps',
    type:      CONFIG_MAP,
    hasDetail: true,
    headers:   [
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

  nodes: {
    singular:  'Node',
    plural:    'Nodes',
    type:      NODE,
    headers:   [
      STATE,
      NODE_NAME,
      ROLES,
      VERSION,
      CPU,
      RAM,
      PODS
    ],
    search:       false,
    tableActions: false,
    hasDetail:    true
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
    singular:  'Service',
    plural:    'Services',
    hasDetail: true,
    type:      RIO.SERVICE,
    headers:   [
      STATE,
      NAMESPACE_NAME_IMAGE,
      ENDPOINTS,
      WEIGHT,
      SCALE,
      {
        name:  'connections',
        label: 'Conn.',
        value: 'connections',
        sort:  ['connections'],
        align: 'right',
        width: 60,
      },
      {
        name:  'p95',
        label: '95%',
        value: 'p95Display',
        sort:  ['p95'],
        align: 'right',
        width: 75,
      },
      {
        name:  'network',
        label: 'Network',
        value: 'networkDisplay',
        sort:  ['networkBytes'],
        align: 'right',
        width: 75,
      },
      AGE,
    ],
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
    type:     RIO.ROUTER,
    headers:  [
      STATE,
      NAMESPACE_NAME,
      MATCHES,
      DESTINATION,
      AGE
    ],
  },

  secrets: {
    singular: 'Secret',
    plural:   'Secrets',
    type:     SECRET,
    headers:  [
      STATE,
      NAMESPACE_NAME,
      KEYS,
      {
        name:  'type',
        label: 'Type',
        value: 'typeDisplay',
        sort:  ['typeDisplay', 'nameSort'],
      },
      CREATED
    ],
    hasDetail: true
  },

  users: {
    singular: 'User',
    plural:   'Users',
    type:     RIO.USER,
    headers:  [
      USER_STATUS,
      USERNAME,
      USER_DISPLAY_NAME,
      USER_ID
    ]
  },

  [RBAC.ROLES]: {
    singular:  'Role',
    plural:    'Roles',
    type:      RBAC.ROLES,
    hasDetail: true,
    headers:   [
      STATE,
      NAME,
      BUILT_IN,
      AGE
    ]
  },

  [RBAC.CLUSTER_ROLES]: {
    singular:  'Cluster Role',
    plural:    'Cluster Roles',
    type:      RBAC.CLUSTER_ROLES,
    hasDetail: true,
    headers:   [
      STATE,
      NAME,
      BUILT_IN,
      CLUSTER_CREATOR_DEFAULT,
      AGE
    ]
  }

};

export const TO_FRIENDLY = {};
Object.keys(FRIENDLY).forEach((key) => {
  const entry = FRIENDLY[key];

  entry.resource = key;

  TO_FRIENDLY[entry.type] = entry;
});
