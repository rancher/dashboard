export const usecases = {
  // 2 same keys entries but with different values, 1 different key, removing one of the same keys
  usecase1: {
    currentConfig: {
      id:    'fleet-default/nc-test-final-1-pool1-mnwmd',
      type:  'elemental.cattle.io.machineinventoryselectortemplate',
      links: {
        remove: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-test-final-1-pool1-mnwmd',
        self:   'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-test-final-1-pool1-mnwmd',
        update: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-test-final-1-pool1-mnwmd',
        view:   'https://localhost:8005/apis/elemental.cattle.io/v1beta1/namespaces/fleet-default/machineinventoryselectortemplates/nc-test-final-1-pool1-mnwmd'
      },
      apiVersion: 'elemental.cattle.io/v1beta1',
      kind:       'MachineInventorySelectorTemplate',
      metadata:   {
        creationTimestamp: '2025-06-16T10:30:24Z',
        fields:            [
          'nc-test-final-1-pool1-mnwmd',
          '51m'
        ],
        generateName:    'nc-test-final-1-pool1-',
        generation:      2,
        name:            'nc-test-final-1-pool1-mnwmd',
        namespace:       'fleet-default',
        ownerReferences: [
          {
            apiVersion: 'cluster.x-k8s.io/v1beta1',
            kind:       'Cluster',
            name:       'test-final-1',
            uid:        'ed1e8c73-bd86-4a19-966a-cb9c4249e7cf'
          }
        ],
        relationships: [
          {
            fromId:   'fleet-default/test-final-1',
            fromType: 'cluster.x-k8s.io.cluster',
            rel:      'owner',
            state:    'provisioned'
          }
        ],
        resourceVersion: '3961358',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: 'bcf115a9-cfb3-416f-8622-98753b9d3081'
      },
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [
                {
                  key:      'key',
                  operator: 'In',
                  values:   [
                    'aaa'
                  ]
                },
                {
                  key:      'key',
                  operator: 'In',
                  values:   [
                    'bbb'
                  ]
                },
                {
                  key:      'create-cluster-selector',
                  operator: 'In',
                  values:   [
                    'cccc'
                  ]
                }
              ],
              matchLabels: { 'create-cluster-selector': 'cccc' }
            }
          },
          status: {
            addresses:           [],
            conditions:          [],
            machineInventoryRef: {}
          }
        }
      },
      __clone: true
    },
    latestConfig: {
      id:    'fleet-default/nc-test-final-1-pool1-mnwmd',
      type:  'elemental.cattle.io.machineinventoryselectortemplate',
      links: {
        remove: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-test-final-1-pool1-mnwmd',
        self:   'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-test-final-1-pool1-mnwmd',
        update: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-test-final-1-pool1-mnwmd',
        view:   'https://localhost:8005/apis/elemental.cattle.io/v1beta1/namespaces/fleet-default/machineinventoryselectortemplates/nc-test-final-1-pool1-mnwmd'
      },
      apiVersion: 'elemental.cattle.io/v1beta1',
      kind:       'MachineInventorySelectorTemplate',
      metadata:   {
        creationTimestamp: '2025-06-16T10:30:24Z',
        fields:            [
          'nc-test-final-1-pool1-mnwmd',
          '34s'
        ],
        generateName:  'nc-test-final-1-pool1-',
        generation:    1,
        managedFields: [
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:ownerReferences': {
                  '.':                                                {},
                  'k:{"uid":"ed1e8c73-bd86-4a19-966a-cb9c4249e7cf"}': {}
                }
              }
            },
            manager:   'manager',
            operation: 'Update',
            time:      '2025-06-16T10:30:24Z'
          },
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:generateName': {} },
              'f:spec':     {
                '.':          {},
                'f:template': {
                  '.':          {},
                  'f:metadata': {},
                  'f:spec':     {
                    '.':          {},
                    'f:selector': {}
                  },
                  'f:status': {
                    '.':                     {},
                    'f:addresses':           {},
                    'f:conditions':          {},
                    'f:machineInventoryRef': {}
                  }
                }
              }
            },
            manager:   'rancher',
            operation: 'Update',
            time:      '2025-06-16T10:30:24Z'
          }
        ],
        name:            'nc-test-final-1-pool1-mnwmd',
        namespace:       'fleet-default',
        ownerReferences: [
          {
            apiVersion: 'cluster.x-k8s.io/v1beta1',
            kind:       'Cluster',
            name:       'test-final-1',
            uid:        'ed1e8c73-bd86-4a19-966a-cb9c4249e7cf'
          }
        ],
        relationships: [
          {
            fromId:   'fleet-default/test-final-1',
            fromType: 'cluster.x-k8s.io.cluster',
            rel:      'owner',
            state:    'provisioned'
          }
        ],
        resourceVersion: '3960953',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: 'bcf115a9-cfb3-416f-8622-98753b9d3081'
      },
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [
                {
                  key:      'key',
                  operator: 'In',
                  values:   [
                    'aaa'
                  ]
                },
                {
                  key:      'key',
                  operator: 'In',
                  values:   [
                    'bbb'
                  ]
                }
              ],
              matchLabels: { 'create-cluster-selector': 'cccc' }
            }
          },
          status: {
            addresses:           [],
            conditions:          [],
            machineInventoryRef: {}
          }
        }
      }
    },
    initialConfig: {
      id:    'fleet-default/nc-test-final-1-pool1-mnwmd',
      type:  'elemental.cattle.io.machineinventoryselectortemplate',
      links: {
        remove: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-test-final-1-pool1-mnwmd',
        self:   'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-test-final-1-pool1-mnwmd',
        update: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-test-final-1-pool1-mnwmd',
        view:   'https://localhost:8005/apis/elemental.cattle.io/v1beta1/namespaces/fleet-default/machineinventoryselectortemplates/nc-test-final-1-pool1-mnwmd'
      },
      apiVersion: 'elemental.cattle.io/v1beta1',
      kind:       'MachineInventorySelectorTemplate',
      metadata:   {
        creationTimestamp: '2025-06-16T10:30:24Z',
        fields:            [
          'nc-test-final-1-pool1-mnwmd',
          '0s'
        ],
        generateName:  'nc-test-final-1-pool1-',
        generation:    1,
        managedFields: [
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:generateName': {} },
              'f:spec':     {
                '.':          {},
                'f:template': {
                  '.':          {},
                  'f:metadata': {},
                  'f:spec':     {
                    '.':          {},
                    'f:selector': {}
                  },
                  'f:status': {
                    '.':                     {},
                    'f:addresses':           {},
                    'f:conditions':          {},
                    'f:machineInventoryRef': {}
                  }
                }
              }
            },
            manager:   'rancher',
            operation: 'Update',
            time:      '2025-06-16T10:30:24Z'
          }
        ],
        name:            'nc-test-final-1-pool1-mnwmd',
        namespace:       'fleet-default',
        relationships:   null,
        resourceVersion: '3960910',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: 'bcf115a9-cfb3-416f-8622-98753b9d3081'
      },
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [
                {
                  key:      'key',
                  operator: 'In',
                  values:   [
                    'aaa'
                  ]
                },
                {
                  key:      'key',
                  operator: 'In',
                  values:   [
                    'bbb'
                  ]
                }
              ],
              matchLabels: { 'create-cluster-selector': 'cccc' }
            }
          },
          status: {
            addresses:           [],
            conditions:          [],
            machineInventoryRef: {}
          }
        }
      },
      __clone: true
    }
  },
  // 2 different keys, removing one of them
  usecase2: {
    currentConfig: {
      id:    'fleet-default/nc-final-test-pool1-7rw9q',
      type:  'elemental.cattle.io.machineinventoryselectortemplate',
      links: {
        remove: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        self:   'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        update: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        view:   'https://localhost:8005/apis/elemental.cattle.io/v1beta1/namespaces/fleet-default/machineinventoryselectortemplates/nc-final-test-pool1-7rw9q'
      },
      apiVersion: 'elemental.cattle.io/v1beta1',
      kind:       'MachineInventorySelectorTemplate',
      metadata:   {
        creationTimestamp: '2025-05-30T09:03:40Z',
        fields:            [
          'nc-final-test-pool1-7rw9q',
          '12m'
        ],
        generateName:    'nc-final-test-pool1-',
        generation:      2,
        name:            'nc-final-test-pool1-7rw9q',
        namespace:       'fleet-default',
        ownerReferences: [
          {
            apiVersion: 'cluster.x-k8s.io/v1beta1',
            kind:       'Cluster',
            name:       'final-test',
            uid:        '0f7602c5-cd8a-41b7-a4ff-30312f882df5'
          }
        ],
        relationships: [
          {
            fromId:   'fleet-default/final-test',
            fromType: 'cluster.x-k8s.io.cluster',
            rel:      'owner',
            state:    'provisioned'
          }
        ],
        resourceVersion: '970275',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '8f2ab229-3bcc-4412-a2d6-f8036dfc4769'
      },
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      {
                'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC',
                key:                       'key1'
              }
            }
          },
          status: {
            addresses:           [],
            conditions:          [],
            machineInventoryRef: {}
          }
        }
      },
      __clone: true
    },
    latestConfig: {
      id:    'fleet-default/nc-final-test-pool1-7rw9q',
      type:  'elemental.cattle.io.machineinventoryselectortemplate',
      links: {
        remove: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        self:   'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        update: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        view:   'https://localhost:8005/apis/elemental.cattle.io/v1beta1/namespaces/fleet-default/machineinventoryselectortemplates/nc-final-test-pool1-7rw9q'
      },
      apiVersion: 'elemental.cattle.io/v1beta1',
      kind:       'MachineInventorySelectorTemplate',
      metadata:   {
        creationTimestamp: '2025-05-30T09:03:40Z',
        fields:            [
          'nc-final-test-pool1-7rw9q',
          '12m'
        ],
        generateName:  'nc-final-test-pool1-',
        generation:    2,
        managedFields: [
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:ownerReferences': {
                  '.':                                                {},
                  'k:{"uid":"0f7602c5-cd8a-41b7-a4ff-30312f882df5"}': {}
                }
              }
            },
            manager:   'manager',
            operation: 'Update',
            time:      '2025-05-30T09:03:41Z'
          },
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:generateName': {} },
              'f:spec':     {
                '.':          {},
                'f:template': {
                  '.':          {},
                  'f:metadata': {},
                  'f:spec':     {
                    '.':          {},
                    'f:selector': {}
                  },
                  'f:status': {
                    '.':                     {},
                    'f:addresses':           {},
                    'f:conditions':          {},
                    'f:machineInventoryRef': {}
                  }
                }
              }
            },
            manager:   'rancher',
            operation: 'Update',
            time:      '2025-05-30T09:15:58Z'
          }
        ],
        name:            'nc-final-test-pool1-7rw9q',
        namespace:       'fleet-default',
        ownerReferences: [
          {
            apiVersion: 'cluster.x-k8s.io/v1beta1',
            kind:       'Cluster',
            name:       'final-test',
            uid:        '0f7602c5-cd8a-41b7-a4ff-30312f882df5'
          }
        ],
        relationships: [
          {
            fromId:   'fleet-default/final-test',
            fromType: 'cluster.x-k8s.io.cluster',
            rel:      'owner',
            state:    'provisioned'
          }
        ],
        resourceVersion: '970275',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '8f2ab229-3bcc-4412-a2d6-f8036dfc4769'
      },
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      {
                'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC',
                key:                       'key1'
              }
            }
          },
          status: {
            addresses:           [],
            conditions:          [],
            machineInventoryRef: {}
          }
        }
      },
      __clone: true
    },
    initialConfig: {
      id:         'fleet-default/nc-final-test-pool1-7rw9q',
      type:       'elemental.cattle.io.machineinventoryselectortemplate',
      apiVersion: 'elemental.cattle.io/v1beta1',
      kind:       'MachineInventorySelectorTemplate',
      metadata:   {
        generateName:    'nc-final-test-pool1-',
        name:            'nc-final-test-pool1-7rw9q',
        namespace:       'fleet-default',
        uid:             '8f2ab229-3bcc-4412-a2d6-f8036dfc4769',
        labels:          {},
        annotations:     {},
        resourceVersion: '970275'
      },
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
            }
          },
          status: {
            addresses:           [],
            conditions:          [],
            machineInventoryRef: {}
          }
        }
      }
    }
  },
  // 1 key left, removing it (no selectors)
  usecase3: {
    currentConfig: {
      id:    'fleet-default/nc-final-test-pool1-7rw9q',
      type:  'elemental.cattle.io.machineinventoryselectortemplate',
      links: {
        remove: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        self:   'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        update: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        view:   'https://localhost:8005/apis/elemental.cattle.io/v1beta1/namespaces/fleet-default/machineinventoryselectortemplates/nc-final-test-pool1-7rw9q'
      },
      apiVersion: 'elemental.cattle.io/v1beta1',
      kind:       'MachineInventorySelectorTemplate',
      metadata:   {
        creationTimestamp: '2025-05-30T09:03:40Z',
        fields:            [
          'nc-final-test-pool1-7rw9q',
          '12m'
        ],
        generateName:  'nc-final-test-pool1-',
        generation:    3,
        managedFields: [
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:ownerReferences': {
                  '.':                                                {},
                  'k:{"uid":"0f7602c5-cd8a-41b7-a4ff-30312f882df5"}': {}
                }
              }
            },
            manager:   'manager',
            operation: 'Update',
            time:      '2025-05-30T09:03:41Z'
          },
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:generateName': {} },
              'f:spec':     {
                '.':          {},
                'f:template': {
                  '.':          {},
                  'f:metadata': {},
                  'f:spec':     {
                    '.':          {},
                    'f:selector': {}
                  },
                  'f:status': {
                    '.':                     {},
                    'f:addresses':           {},
                    'f:conditions':          {},
                    'f:machineInventoryRef': {}
                  }
                }
              }
            },
            manager:   'rancher',
            operation: 'Update',
            time:      '2025-05-30T09:16:20Z'
          }
        ],
        name:            'nc-final-test-pool1-7rw9q',
        namespace:       'fleet-default',
        ownerReferences: [
          {
            apiVersion: 'cluster.x-k8s.io/v1beta1',
            kind:       'Cluster',
            name:       'final-test',
            uid:        '0f7602c5-cd8a-41b7-a4ff-30312f882df5'
          }
        ],
        relationships: [
          {
            fromId:   'fleet-default/final-test',
            fromType: 'cluster.x-k8s.io.cluster',
            rel:      'owner',
            state:    'provisioned'
          }
        ],
        resourceVersion: '970343',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '8f2ab229-3bcc-4412-a2d6-f8036dfc4769'
      },
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
            }
          },
          status: {
            addresses:           [],
            conditions:          [],
            machineInventoryRef: {}
          }
        }
      },
      __clone: true
    },
    latestConfig: {
      id:    'fleet-default/nc-final-test-pool1-7rw9q',
      type:  'elemental.cattle.io.machineinventoryselectortemplate',
      links: {
        remove: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        self:   'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        update: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        view:   'https://localhost:8005/apis/elemental.cattle.io/v1beta1/namespaces/fleet-default/machineinventoryselectortemplates/nc-final-test-pool1-7rw9q'
      },
      apiVersion: 'elemental.cattle.io/v1beta1',
      kind:       'MachineInventorySelectorTemplate',
      metadata:   {
        creationTimestamp: '2025-05-30T09:03:40Z',
        fields:            [
          'nc-final-test-pool1-7rw9q',
          '13m'
        ],
        generateName:  'nc-final-test-pool1-',
        generation:    3,
        managedFields: [
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:ownerReferences': {
                  '.':                                                {},
                  'k:{"uid":"0f7602c5-cd8a-41b7-a4ff-30312f882df5"}': {}
                }
              }
            },
            manager:   'manager',
            operation: 'Update',
            time:      '2025-05-30T09:03:41Z'
          },
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:generateName': {} },
              'f:spec':     {
                '.':          {},
                'f:template': {
                  '.':          {},
                  'f:metadata': {},
                  'f:spec':     {
                    '.':          {},
                    'f:selector': {}
                  },
                  'f:status': {
                    '.':                     {},
                    'f:addresses':           {},
                    'f:conditions':          {},
                    'f:machineInventoryRef': {}
                  }
                }
              }
            },
            manager:   'rancher',
            operation: 'Update',
            time:      '2025-05-30T09:16:20Z'
          }
        ],
        name:            'nc-final-test-pool1-7rw9q',
        namespace:       'fleet-default',
        ownerReferences: [
          {
            apiVersion: 'cluster.x-k8s.io/v1beta1',
            kind:       'Cluster',
            name:       'final-test',
            uid:        '0f7602c5-cd8a-41b7-a4ff-30312f882df5'
          }
        ],
        relationships: [
          {
            fromId:   'fleet-default/final-test',
            fromType: 'cluster.x-k8s.io.cluster',
            rel:      'owner',
            state:    'provisioned'
          }
        ],
        resourceVersion: '970343',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '8f2ab229-3bcc-4412-a2d6-f8036dfc4769'
      },
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxC' }
            }
          },
          status: {
            addresses:           [],
            conditions:          [],
            machineInventoryRef: {}
          }
        }
      },
      __clone: true
    },
    initialConfig: {
      id:         'fleet-default/nc-final-test-pool1-7rw9q',
      type:       'elemental.cattle.io.machineinventoryselectortemplate',
      apiVersion: 'elemental.cattle.io/v1beta1',
      kind:       'MachineInventorySelectorTemplate',
      metadata:   {
        generateName:    'nc-final-test-pool1-',
        name:            'nc-final-test-pool1-7rw9q',
        namespace:       'fleet-default',
        uid:             '8f2ab229-3bcc-4412-a2d6-f8036dfc4769',
        labels:          {},
        annotations:     {},
        resourceVersion: '970343'
      },
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      {}
            }
          },
          status: {
            addresses:           [],
            conditions:          [],
            machineInventoryRef: {}
          }
        }
      }
    }
  },
  // FAIL!!! - matchLabels changed on both latest and current + resourceVersion on latest
  usecase4: {
    currentConfig: {
      id:    'fleet-default/nc-final-test-pool1-7rw9q',
      type:  'elemental.cattle.io.machineinventoryselectortemplate',
      links: {
        remove: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        self:   'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        update: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        view:   'https://localhost:8005/apis/elemental.cattle.io/v1beta1/namespaces/fleet-default/machineinventoryselectortemplates/nc-final-test-pool1-7rw9q'
      },
      apiVersion: 'elemental.cattle.io/v1beta1',
      kind:       'MachineInventorySelectorTemplate',
      metadata:   {
        creationTimestamp: '2025-05-30T09:03:40Z',
        fields:            [
          'nc-final-test-pool1-7rw9q',
          '12m'
        ],
        generateName:  'nc-final-test-pool1-',
        generation:    3,
        managedFields: [
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:ownerReferences': {
                  '.':                                                {},
                  'k:{"uid":"0f7602c5-cd8a-41b7-a4ff-30312f882df5"}': {}
                }
              }
            },
            manager:   'manager',
            operation: 'Update',
            time:      '2025-05-30T09:03:41Z'
          },
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:generateName': {} },
              'f:spec':     {
                '.':          {},
                'f:template': {
                  '.':          {},
                  'f:metadata': {},
                  'f:spec':     {
                    '.':          {},
                    'f:selector': {}
                  },
                  'f:status': {
                    '.':                     {},
                    'f:addresses':           {},
                    'f:conditions':          {},
                    'f:machineInventoryRef': {}
                  }
                }
              }
            },
            manager:   'rancher',
            operation: 'Update',
            time:      '2025-05-30T09:16:20Z'
          }
        ],
        name:            'nc-final-test-pool1-7rw9q',
        namespace:       'fleet-default',
        ownerReferences: [
          {
            apiVersion: 'cluster.x-k8s.io/v1beta1',
            kind:       'Cluster',
            name:       'final-test',
            uid:        '0f7602c5-cd8a-41b7-a4ff-30312f882df5'
          }
        ],
        relationships: [
          {
            fromId:   'fleet-default/final-test',
            fromType: 'cluster.x-k8s.io.cluster',
            rel:      'owner',
            state:    'provisioned'
          }
        ],
        resourceVersion: '970343',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '8f2ab229-3bcc-4412-a2d6-f8036dfc4769'
      },
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxCbbbbbbbbb' }
            }
          },
          status: {
            addresses:           [],
            conditions:          [],
            machineInventoryRef: {}
          }
        }
      },
      __clone: true
    },
    latestConfig: {
      id:    'fleet-default/nc-final-test-pool1-7rw9q',
      type:  'elemental.cattle.io.machineinventoryselectortemplate',
      links: {
        remove: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        self:   'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        update: 'https://localhost:8005/v1/elemental.cattle.io.machineinventoryselectortemplates/fleet-default/nc-final-test-pool1-7rw9q',
        view:   'https://localhost:8005/apis/elemental.cattle.io/v1beta1/namespaces/fleet-default/machineinventoryselectortemplates/nc-final-test-pool1-7rw9q'
      },
      apiVersion: 'elemental.cattle.io/v1beta1',
      kind:       'MachineInventorySelectorTemplate',
      metadata:   {
        creationTimestamp: '2025-05-30T09:03:40Z',
        fields:            [
          'nc-final-test-pool1-7rw9q',
          '13m'
        ],
        generateName:  'nc-final-test-pool1-',
        generation:    3,
        managedFields: [
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': {
                'f:ownerReferences': {
                  '.':                                                {},
                  'k:{"uid":"0f7602c5-cd8a-41b7-a4ff-30312f882df5"}': {}
                }
              }
            },
            manager:   'manager',
            operation: 'Update',
            time:      '2025-05-30T09:03:41Z'
          },
          {
            apiVersion: 'elemental.cattle.io/v1beta1',
            fieldsType: 'FieldsV1',
            fieldsV1:   {
              'f:metadata': { 'f:generateName': {} },
              'f:spec':     {
                '.':          {},
                'f:template': {
                  '.':          {},
                  'f:metadata': {},
                  'f:spec':     {
                    '.':          {},
                    'f:selector': {}
                  },
                  'f:status': {
                    '.':                     {},
                    'f:addresses':           {},
                    'f:conditions':          {},
                    'f:machineInventoryRef': {}
                  }
                }
              }
            },
            manager:   'rancher',
            operation: 'Update',
            time:      '2025-05-30T09:16:20Z'
          }
        ],
        name:            'nc-final-test-pool1-7rw9q',
        namespace:       'fleet-default',
        ownerReferences: [
          {
            apiVersion: 'cluster.x-k8s.io/v1beta1',
            kind:       'Cluster',
            name:       'final-test',
            uid:        '0f7602c5-cd8a-41b7-a4ff-30312f882df5'
          }
        ],
        relationships: [
          {
            fromId:   'fleet-default/final-test',
            fromType: 'cluster.x-k8s.io.cluster',
            rel:      'owner',
            state:    'provisioned'
          }
        ],
        resourceVersion: '970344',
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '8f2ab229-3bcc-4412-a2d6-f8036dfc4769'
      },
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      { 'create-cluster-selector': 'Z3soEpn7z3OSoktiJsmVHuxCaaaa' }
            }
          },
          status: {
            addresses:           [],
            conditions:          [],
            machineInventoryRef: {}
          }
        }
      },
      __clone: true
    },
    initialConfig: {
      id:         'fleet-default/nc-final-test-pool1-7rw9q',
      type:       'elemental.cattle.io.machineinventoryselectortemplate',
      apiVersion: 'elemental.cattle.io/v1beta1',
      kind:       'MachineInventorySelectorTemplate',
      metadata:   {
        generateName:    'nc-final-test-pool1-',
        name:            'nc-final-test-pool1-7rw9q',
        namespace:       'fleet-default',
        uid:             '8f2ab229-3bcc-4412-a2d6-f8036dfc4769',
        labels:          {},
        annotations:     {},
        resourceVersion: '970343'
      },
      spec: {
        template: {
          metadata: {},
          spec:     {
            selector: {
              matchExpressions: [],
              matchLabels:      {}
            }
          },
          status: {
            addresses:           [],
            conditions:          [],
            machineInventoryRef: {}
          }
        }
      }
    }
  }
};
