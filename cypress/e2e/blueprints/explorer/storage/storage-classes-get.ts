import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../blueprint.utils';

// GET /v1/storage.k8s.io.storageclasses- return empty storageclasses data
const pstorageclassesGetResponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/storage.k8s.io.storageclasses' },
  createTypes:  { 'storage.k8s.io.storageclass': 'https://yonasb29head.qa.rancher.space/v1/storage.k8s.io.storageclasses' },
  actions:      {},
  resourceType: 'storage.k8s.io.storageclass',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        0,
  data:         []
};

// GET /v1/storage.k8s.io.storageclasses- small set of storageclasses data
const storageclassesResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/storage.k8s.io.storageclasses' },
  createTypes:  { 'storage.k8s.io.storageclass': 'https://yonasb29head.qa.rancher.space/v1/storage.k8s.io.storageclasses' },
  actions:      {},
  resourceType: 'storage.k8s.io.storageclass',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        1,
  data:         [{
    id:    'test',
    type:  'storage.k8s.io.storageclass',
    links: {
      remove: 'https://yonasb29head.qa.rancher.space/v1/storage.k8s.io.storageclasses/test', self: 'https://yonasb29head.qa.rancher.space/v1/storage.k8s.io.storageclasses/test', update: 'https://yonasb29head.qa.rancher.space/v1/storage.k8s.io.storageclasses/test', view: 'https://yonasb29head.qa.rancher.space/apis/storage.k8s.io/v1/storageclasses/test'
    },
    allowVolumeExpansion: false,
    apiVersion:           'storage.k8s.io/v1',
    kind:                 'StorageClass',
    metadata:             {
      creationTimestamp: '2024-07-05T00:42:04Z',
      fields:            ['test', 'kubernetes.io/aws-ebs', 'Delete', 'Immediate', false, '7m47s'],
      name:              'test',
      relationships:     null,
      resourceVersion:   '3958373',
      state:             {
        error: false, message: 'Resource is current', name: 'active', transitioning: false
      },
      uid: '2d668a5a-748f-48b4-9eaa-0b82954dd42e'
    },
    parameters: {
      encrypted: 'true', iopsPerGB: '0', type: 'gp2'
    },
    provisioner:       'kubernetes.io/aws-ebs',
    reclaimPolicy:     'Delete',
    volumeBindingMode: 'Immediate'
  }]
};

function reply(statusCode: number, body: any) {
  return (req) => {
    req.reply({
      statusCode,
      body
    });
  };
}

export function storageClassesNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/storage.k8s.io.storageclasses?*', reply(200, pstorageclassesGetResponseEmpty)).as('storageclassesNoData');
}

export function generateStorageClassesDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/storage.k8s.io.storageclasses?*', reply(200, storageclassesResponseSmallSet)).as('storageclassesDataSmall');
}
