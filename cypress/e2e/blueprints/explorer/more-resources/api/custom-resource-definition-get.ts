import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

// GET /v1/apiextensions.k8s.io.customresourcedefinitions - small set of crds data
const crdsGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/apiextensions.k8s.io.customresourcedefinitions' },
  createTypes:  { 'apiextensions.k8s.io.customresourcedefinition': 'https://yonasb29head.qa.rancher.space/v1/apiextensions.k8s.io.customresourcedefinitions' },
  actions:      {},
  resourceType: 'apiextensions.k8s.io.customresourcedefinition',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION, // The UI will use this point in history to start watching for changes from. If it's too low (than the global system revision) we will spam with requests
  count:        2,
  data:         [
    {
      id:    'users.management.cattle.io',
      type:  'apiextensions.k8s.io.customresourcedefinition',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/apiextensions.k8s.io.customresourcedefinitions/users.management.cattle.io',
        self:   'https://yonasb29head.qa.rancher.space/v1/apiextensions.k8s.io.customresourcedefinitions/users.management.cattle.io',
        update: 'https://yonasb29head.qa.rancher.space/v1/apiextensions.k8s.io.customresourcedefinitions/users.management.cattle.io',
        view:   'https://yonasb29head.qa.rancher.space/apis/apiextensions.k8s.io/v1/customresourcedefinitions/users.management.cattle.io'
      },
      apiVersion: 'apiextensions.k8s.io/v1',
      kind:       'CustomResourceDefinition',
      metadata:   {
        creationTimestamp: '2024-06-27T20:32:20Z',
        fields:            [
          'users.management.cattle.io',
          '2024-06-27T20:32:20Z'
        ],
        generation:      1,
        name:            'users.management.cattle.io',
        relationships:   null,
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'CRD is established',
          name:          'active',
          transitioning: false
        },
        uid: 'c27f4c68-da43-4361-bb71-fc8aa111a313'
      },
      spec: {
        conversion: { strategy: 'None' },
        group:      'management.cattle.io',
        names:      {
          kind:     'User',
          listKind: 'UserList',
          plural:   'users',
          singular: 'user'
        },
        scope:    'Cluster',
        versions: [
          {
            name:   'v3',
            schema: {
              openAPIV3Schema: {
                type:                                   'object',
                'x-kubernetes-preserve-unknown-fields': true
              }
            },
            served:  true,
            storage: true
          }
        ]
      },
      status: {
        acceptedNames: {
          kind:     'User',
          listKind: 'UserList',
          plural:   'users',
          singular: 'user'
        },
        conditions: [
          {
            error:              false,
            lastTransitionTime: '2024-06-27T20:32:20Z',
            lastUpdateTime:     '2024-06-27T20:32:20Z',
            message:            'no conflicts found',
            reason:             'NoConflicts',
            status:             'True',
            transitioning:      false,
            type:               'NamesAccepted'
          },
          {
            error:              false,
            lastTransitionTime: '2024-06-27T20:32:21Z',
            lastUpdateTime:     '2024-06-27T20:32:21Z',
            message:            'the initial names have been accepted',
            reason:             'InitialNamesAccepted',
            status:             'True',
            transitioning:      false,
            type:               'Established'
          }
        ],
        storedVersions: [
          'v3'
        ]
      }
    },
    {
      id:    'volumesnapshotclasses.snapshot.storage.k8s.io',
      type:  'apiextensions.k8s.io.customresourcedefinition',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/apiextensions.k8s.io.customresourcedefinitions/volumesnapshotclasses.snapshot.storage.k8s.io',
        self:   'https://yonasb29head.qa.rancher.space/v1/apiextensions.k8s.io.customresourcedefinitions/volumesnapshotclasses.snapshot.storage.k8s.io',
        update: 'https://yonasb29head.qa.rancher.space/v1/apiextensions.k8s.io.customresourcedefinitions/volumesnapshotclasses.snapshot.storage.k8s.io',
        view:   'https://yonasb29head.qa.rancher.space/apis/apiextensions.k8s.io/v1/customresourcedefinitions/volumesnapshotclasses.snapshot.storage.k8s.io'
      },
      apiVersion: 'apiextensions.k8s.io/v1',
      kind:       'CustomResourceDefinition',
      metadata:   {
        annotations: {
          'api-approved.kubernetes.io':            'https://github.com/kubernetes-csi/external-snapshotter/pull/665',
          'controller-gen.kubebuilder.io/version': 'v0.8.0',
          'meta.helm.sh/release-name':             'rke2-snapshot-controller-crd',
          'meta.helm.sh/release-namespace':        'kube-system'
        },
        creationTimestamp: '2024-06-27T20:20:49Z',
        fields:            [
          'volumesnapshotclasses.snapshot.storage.k8s.io',
          '2024-06-27T20:20:49Z'
        ],
        generation:    1,
        labels:        { 'app.kubernetes.io/managed-by': 'Helm' },
        name:          'volumesnapshotclasses.snapshot.storage.k8s.io',
        relationships: [
          {
            fromId:   'kube-system/rke2-snapshot-controller-crd',
            fromType: 'catalog.cattle.io.app',
            rel:      'helmresource',
            state:    'deployed'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'CRD is established',
          name:          'active',
          transitioning: false
        },
        uid: '5a36103d-b699-4d33-b154-5e8581821447'
      },
      spec: {
        conversion: { strategy: 'None' },
        group:      'snapshot.storage.k8s.io',
        names:      {
          kind:       'VolumeSnapshotClass',
          listKind:   'VolumeSnapshotClassList',
          plural:     'volumesnapshotclasses',
          shortNames: [
            'vsclass',
            'vsclasses'
          ],
          singular: 'volumesnapshotclass'
        },
        scope:    'Cluster',
        versions: [
          {
            additionalPrinterColumns: [
              {
                jsonPath: '.driver',
                name:     'Driver',
                type:     'string'
              },
              {
                description: 'Determines whether a VolumeSnapshotContent created through the VolumeSnapshotClass should be deleted when its bound VolumeSnapshot is deleted.',
                jsonPath:    '.deletionPolicy',
                name:        'DeletionPolicy',
                type:        'string'
              },
              {
                jsonPath: '.metadata.creationTimestamp',
                name:     'Age',
                type:     'date'
              }
            ],
            name:   'v1',
            schema: {
              openAPIV3Schema: {
                description: 'VolumeSnapshotClass specifies parameters that a underlying storage system uses when creating a volume snapshot. A specific VolumeSnapshotClass is used by specifying its name in a VolumeSnapshot object. VolumeSnapshotClasses are non-namespaced',
                properties:  {
                  apiVersion: {
                    description: 'APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources',
                    type:        'string'
                  },
                  deletionPolicy: {
                    description: 'deletionPolicy determines whether a VolumeSnapshotContent created through the VolumeSnapshotClass should be deleted when its bound VolumeSnapshot is deleted. Supported values are "Retain" and "Delete". "Retain" means that the VolumeSnapshotContent and its physical snapshot on underlying storage system are kept. "Delete" means that the VolumeSnapshotContent and its physical snapshot on underlying storage system are deleted. Required.',
                    enum:        [
                      'Delete',
                      'Retain'
                    ],
                    type: 'string'
                  },
                  driver: {
                    description: 'driver is the name of the storage driver that handles this VolumeSnapshotClass. Required.',
                    type:        'string'
                  },
                  kind: {
                    description: 'Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds',
                    type:        'string'
                  },
                  parameters: {
                    additionalProperties: { type: 'string' },
                    description:          'parameters is a key-value map with storage driver specific parameters for creating snapshots. These values are opaque to Kubernetes.',
                    type:                 'object'
                  }
                },
                required: [
                  'deletionPolicy',
                  'driver'
                ],
                type: 'object'
              }
            },
            served:       true,
            storage:      true,
            subresources: {}
          },
          {
            additionalPrinterColumns: [
              {
                jsonPath: '.driver',
                name:     'Driver',
                type:     'string'
              },
              {
                description: 'Determines whether a VolumeSnapshotContent created through the VolumeSnapshotClass should be deleted when its bound VolumeSnapshot is deleted.',
                jsonPath:    '.deletionPolicy',
                name:        'DeletionPolicy',
                type:        'string'
              },
              {
                jsonPath: '.metadata.creationTimestamp',
                name:     'Age',
                type:     'date'
              }
            ],
            deprecated:         true,
            deprecationWarning: 'snapshot.storage.k8s.io/v1beta1 VolumeSnapshotClass is deprecated; use snapshot.storage.k8s.io/v1 VolumeSnapshotClass',
            name:               'v1beta1',
            schema:             {
              openAPIV3Schema: {
                description: 'VolumeSnapshotClass specifies parameters that a underlying storage system uses when creating a volume snapshot. A specific VolumeSnapshotClass is used by specifying its name in a VolumeSnapshot object. VolumeSnapshotClasses are non-namespaced',
                properties:  {
                  apiVersion: {
                    description: 'APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources',
                    type:        'string'
                  },
                  deletionPolicy: {
                    description: 'deletionPolicy determines whether a VolumeSnapshotContent created through the VolumeSnapshotClass should be deleted when its bound VolumeSnapshot is deleted. Supported values are "Retain" and "Delete". "Retain" means that the VolumeSnapshotContent and its physical snapshot on underlying storage system are kept. "Delete" means that the VolumeSnapshotContent and its physical snapshot on underlying storage system are deleted. Required.',
                    enum:        [
                      'Delete',
                      'Retain'
                    ],
                    type: 'string'
                  },
                  driver: {
                    description: 'driver is the name of the storage driver that handles this VolumeSnapshotClass. Required.',
                    type:        'string'
                  },
                  kind: {
                    description: 'Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds',
                    type:        'string'
                  },
                  parameters: {
                    additionalProperties: { type: 'string' },
                    description:          'parameters is a key-value map with storage driver specific parameters for creating snapshots. These values are opaque to Kubernetes.',
                    type:                 'object'
                  }
                },
                required: [
                  'deletionPolicy',
                  'driver'
                ],
                type: 'object'
              }
            },
            served:       true,
            storage:      false,
            subresources: {}
          }
        ]
      },
      status: {
        acceptedNames: {
          kind:       'VolumeSnapshotClass',
          listKind:   'VolumeSnapshotClassList',
          plural:     'volumesnapshotclasses',
          shortNames: [
            'vsclass',
            'vsclasses'
          ],
          singular: 'volumesnapshotclass'
        },
        conditions: [
          {
            error:              false,
            lastTransitionTime: '2024-06-27T20:20:50Z',
            lastUpdateTime:     '2024-06-27T20:20:50Z',
            message:            'approved in https://github.com/kubernetes-csi/external-snapshotter/pull/665',
            reason:             'ApprovedAnnotation',
            status:             'True',
            transitioning:      false,
            type:               'KubernetesAPIApprovalPolicyConformant'
          },
          {
            error:              false,
            lastTransitionTime: '2024-06-27T20:20:54Z',
            lastUpdateTime:     '2024-06-27T20:20:54Z',
            message:            'no conflicts found',
            reason:             'NoConflicts',
            status:             'True',
            transitioning:      false,
            type:               'NamesAccepted'
          },
          {
            error:              false,
            lastTransitionTime: '2024-06-27T20:20:54Z',
            lastUpdateTime:     '2024-06-27T20:20:54Z',
            message:            'the initial names have been accepted',
            reason:             'InitialNamesAccepted',
            status:             'True',
            transitioning:      false,
            type:               'Established'
          }
        ],
        storedVersions: [
          'v1'
        ]
      }
    }
  ]
};

function reply(statusCode: number, body: any) {
  return (req) => {
    req.reply({
      statusCode,
      body
    });
  };
}

export function generateCrdsDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/apiextensions.k8s.io.customresourcedefinitions?*', reply(200, crdsGetResponseSmallSet)).as('crdsDataSmall');
}
