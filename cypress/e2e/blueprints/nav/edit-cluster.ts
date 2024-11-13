import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

// /v1/management.cattle.io.nodedrivers?*
export function generateFakeNodeDriversReply():any {
  return {
    id:    'digitalocean',
    type:  'management.cattle.io.nodedriver',
    links: {
      remove: 'blocked',
      self:   'https://localhost:8005/v1/management.cattle.io.nodedrivers/digitalocean',
      update: 'blocked',
      view:   'https://localhost:8005/v1/management.cattle.io.nodedrivers/digitalocean'
    },
    apiVersion: 'management.cattle.io/v3',
    kind:       'NodeDriver',
    metadata:   {
      annotations: {
        'io.cattle.nodedriver/ui-field-hints':               '{"sshKeyContents":{"type":"multiline"},"userdata":{"type":"multiline"}}',
        'lifecycle.cattle.io/create.node-driver-controller': 'true',
        privateCredentialFields:                             'accessToken'
      },
      creationTimestamp: '2024-04-12T08:53:37Z',
      fields:            [
        'digitalocean',
        '12d'
      ],
      finalizers: [
        'controller.cattle.io/node-driver-controller'
      ],
      generation:    4,
      labels:        { 'cattle.io/creator': 'norman' },
      name:          'digitalocean',
      relationships: [
        {
          toId:    'digitaloceancredentialconfig',
          toType:  'management.cattle.io.dynamicschema',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    'digitaloceanconfig',
          toType:  'management.cattle.io.dynamicschema',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        }
      ],
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      state:           {
        error:         false,
        message:       '',
        name:          'active',
        transitioning: false
      },
      uid: '611dbaa1-9ba4-463f-ad61-12c2b879fbad'
    },
    spec: {
      active:             true,
      addCloudCredential: false,
      builtin:            true,
      checksum:           '',
      description:        '',
      displayName:        'digitalocean',
      externalId:         '',
      uiUrl:              '',
      url:                'local://',
      whitelistDomains:   [
        'api.digitalocean.com'
      ]
    },
    status: {
      appliedChecksum:             '',
      appliedDockerMachineVersion: 'rancher-machine version v0.15.0-rancher109, build 11ea4b32\n',
      appliedURL:                  '',
      conditions:                  [
        {
          error:          false,
          lastUpdateTime: '2024-04-12T08:53:41Z',
          status:         'True',
          transitioning:  false,
          type:           'Downloaded'
        },
        {
          error:          false,
          lastUpdateTime: '2024-04-12T08:53:41Z',
          status:         'True',
          transitioning:  false,
          type:           'Installed'
        },
        {
          error:          false,
          lastUpdateTime: '2024-04-12T08:53:52Z',
          status:         'True',
          transitioning:  false,
          type:           'Active'
        },
        {
          error:          false,
          lastUpdateTime: '2024-04-12T08:53:52Z',
          status:         'True',
          transitioning:  false,
          type:           'Inactive'
        }
      ]
    }
  };
}

// /v3/cloudcredentials
export function generateFakeCloudCredentialsReply(cloudCredId:string):any {
  return {
    type:        'collection',
    links:       { self: 'https://localhost:8005/v3/cloudcredentials' },
    createTypes: { cloudCredential: 'https://localhost:8005/v3/cloudcredentials' },
    actions:     {},
    pagination:  {
      limit: 1000,
      total: 1
    },
    sort: {
      order:   'asc',
      reverse: 'https://localhost:8005/v3/cloudcredentials?order=desc',
      links:   {
        description: 'https://localhost:8005/v3/cloudcredentials?sort=description',
        name:        'https://localhost:8005/v3/cloudcredentials?sort=name',
        uuid:        'https://localhost:8005/v3/cloudcredentials?sort=uuid'
      }
    },
    filters: {
      created:     null,
      creatorId:   null,
      description: null,
      id:          null,
      name:        null,
      removed:     null,
      uuid:        null
    },
    resourceType: 'cloudCredential',
    data:         [
      {
        annotations:                  {},
        baseType:                     'cloudCredential',
        created:                      '2024-04-23T11:57:20Z',
        createdTS:                    1713873440000,
        creatorId:                    'user-ghfld',
        digitaloceancredentialConfig: {},
        id:                           `cattle-global-data:cc-${ cloudCredId }`,
        labels:                       { 'cattle.io/creator': 'norman' },
        links:                        {
          nodeTemplates: `https://localhost:8005/v3/nodeTemplates?cloudCredentialId=cattle-global-data%3Acc-${ cloudCredId }`,
          remove:        `https://localhost:8005/v3/cloudCredentials/cattle-global-data:cc-${ cloudCredId }`,
          self:          `https://localhost:8005/v3/cloudCredentials/cattle-global-data:cc-${ cloudCredId }`,
          update:        `https://localhost:8005/v3/cloudCredentials/cattle-global-data:cc-${ cloudCredId }`
        },
        name: 'test-do-creds',
        type: 'cloudCredential',
        uuid: 'e6e0e54b-9077-46d7-8aa7-b9231a955aed'
      }
    ]
  };
}

export function generateFakeCloudCredIndividualReply(cloudCredId:string):any {
  return {
    annotations:                  {},
    baseType:                     'cloudCredential',
    created:                      '2024-04-23T11:57:20Z',
    createdTS:                    1713873440000,
    creatorId:                    'user-ghfld',
    digitaloceancredentialConfig: {},
    id:                           `cattle-global-data:cc-${ cloudCredId }`,
    labels:                       { 'cattle.io/creator': 'norman' },
    links:                        {
      nodeTemplates: `https://localhost:8005/v3/nodeTemplates?cloudCredentialId=cattle-global-data%3Acc-${ cloudCredId }`,
      remove:        `https://localhost:8005/v3/cloudCredentials/cattle-global-data:cc-${ cloudCredId }`,
      self:          `https://localhost:8005/v3/cloudCredentials/cattle-global-data:cc-${ cloudCredId }`,
      update:        `https://localhost:8005/v3/cloudCredentials/cattle-global-data:cc-${ cloudCredId }`
    },
    name: 'test-do-creds',
    type: 'cloudCredential',
    uuid: 'e6e0e54b-9077-46d7-8aa7-b9231a955aed'
  };
}
// /v1/rke-machine-config.cattle.io.digitaloceanconfigs/fleet-default/nc-${ provClusterId }-pool1-${machinePoolId}?*
export function generateFakeMachineConfigReply(provClusterId:string, machinePoolId:string):any {
  return {
    id:    `fleet-default/nc-${ provClusterId }-pool1-${ machinePoolId }`,
    type:  'rke-machine-config.cattle.io.digitaloceanconfig',
    links: {
      remove: `https://localhost:8005/v1/rke-machine-config.cattle.io.digitaloceanconfigs/fleet-default/nc-${ provClusterId }-pool1-${ machinePoolId }`,
      self:   `https://localhost:8005/v1/rke-machine-config.cattle.io.digitaloceanconfigs/fleet-default/nc-${ provClusterId }-pool1-${ machinePoolId }`,
      update: `https://localhost:8005/v1/rke-machine-config.cattle.io.digitaloceanconfigs/fleet-default/nc-${ provClusterId }-pool1-${ machinePoolId }`,
      view:   `https://localhost:8005/apis/rke-machine-config.cattle.io/v1/namespaces/fleet-default/digitaloceanconfigs/nc-${ provClusterId }-pool1-${ machinePoolId }`
    },
    accessToken: '',
    apiVersion:  'rke-machine-config.cattle.io/v1',
    backups:     false,
    image:       'ubuntu-20-04-x64',
    ipv6:        false,
    kind:        'DigitaloceanConfig',
    metadata:    {
      annotations: {
        'field.cattle.io/creatorId': 'user-ghfld',
        ownerBindingsCreated:        'true'
      },
      creationTimestamp: '2024-04-23T11:57:44Z',
      fields:            [
        `nc-${ provClusterId }-pool1-${ machinePoolId }`,
        '27h'
      ],
      generateName:    `nc-${ provClusterId }-pool1-`,
      generation:      1,
      name:            `nc-${ provClusterId }-pool1-${ machinePoolId }`,
      namespace:       'fleet-default',
      ownerReferences: [
        {
          apiVersion:         'provisioning.cattle.io/v1',
          blockOwnerDeletion: true,
          controller:         true,
          kind:               'Cluster',
          name:               provClusterId,
          uid:                'fa5f2394-7a7c-4079-86e8-21b514792244'
        }
      ],
      relationships: [
        {
          fromId:   `fleet-default/${ provClusterId }`,
          fromType: 'provisioning.cattle.io.cluster',
          rel:      'owner',
          state:    'active',
          message:  'Resource is Ready'
        },
        {
          toId:    `fleet-default/nc-${ provClusterId }-pool1-${ machinePoolId }-digitaloceanconfigs-a`,
          toType:  'rbac.authorization.k8s.io.role',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        },
        {
          toId:    `fleet-default/nc-${ provClusterId }-pool1-${ machinePoolId }-digitaloceanconfigs-a`,
          toType:  'rbac.authorization.k8s.io.rolebinding',
          rel:     'owner',
          state:   'active',
          message: 'Resource is current'
        }
      ],
      resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
      state:           {
        error:         false,
        message:       'Resource is current',
        name:          'active',
        transitioning: false
      },
      uid: '6a2d94e5-e6a6-4f5e-bede-2b21c3a2009e'
    },
    monitoring:        false,
    privateNetworking: false,
    region:            'lon1',
    size:              's-4vcpu-8gb',
    sshKeyContents:    '',
    sshKeyFingerprint: '',
    sshPort:           '22',
    sshUser:           'root',
    tags:              '',
    userdata:          ''
  };
}

export function generateFakeSecretsReply():any {
  return [
    {
      id:    'fleet-default/registryconfig-auth-reg1',
      type:  'secret',
      links: {
        remove: 'https://localhost:8005/v1/secrets/fleet-default/registryconfig-auth-reg1',
        self:   'https://localhost:8005/v1/secrets/fleet-default/registryconfig-auth-reg1',
        update: 'https://localhost:8005/v1/secrets/fleet-default/registryconfig-auth-reg1',
        view:   'https://localhost:8005/api/v1/namespaces/fleet-default/secrets/registryconfig-auth-reg1'
      },
      _type:      'kubernetes.io/basic-auth',
      apiVersion: 'v1',
      data:       {
        password: 'YmJi',
        username: 'YWFh'
      },
      kind:     'Secret',
      metadata: {
        creationTimestamp: '2024-04-24T17:18:59Z',
        fields:            [
          'registryconfig-auth-reg1',
          'kubernetes.io/basic-auth',
          2,
          '9m31s'
        ],
        generateName:    'registryconfig-auth-',
        name:            'registryconfig-auth-reg1',
        namespace:       'fleet-default',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is always ready',
          name:          'active',
          transitioning: false
        },
        uid: '5634635f-9b3f-4872-9cc6-f9a3028bf306'
      }
    },
    {
      id:    'fleet-default/registryconfig-auth-reg2',
      type:  'secret',
      links: {
        remove: 'https://localhost:8005/v1/secrets/fleet-default/registryconfig-auth-reg2',
        self:   'https://localhost:8005/v1/secrets/fleet-default/registryconfig-auth-reg2',
        update: 'https://localhost:8005/v1/secrets/fleet-default/registryconfig-auth-reg2',
        view:   'https://localhost:8005/api/v1/namespaces/fleet-default/secrets/registryconfig-auth-reg2'
      },
      _type:      'kubernetes.io/basic-auth',
      apiVersion: 'v1',
      data:       {
        password: 'YmJi',
        username: 'YWFh'
      },
      kind:     'Secret',
      metadata: {
        creationTimestamp: '2024-04-24T17:18:59Z',
        fields:            [
          'registryconfig-auth-reg2',
          'kubernetes.io/basic-auth',
          2,
          '9m31s'
        ],
        generateName:    'registryconfig-auth-',
        name:            'registryconfig-auth-reg2',
        namespace:       'fleet-default',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is always ready',
          name:          'active',
          transitioning: false
        },
        uid: '5634635f-9b3f-4872-9cc6-f9a3028bf306'
      }
    }
  ];
}
