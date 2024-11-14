import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../blueprint.utils';

// GET /v1/persistentvolumeclaim- return empty persistentvolumeclaims data
const persistentvolumeclaimsGetResponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumeclaims' },
  createTypes:  { persistentvolumeclaim: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumeclaims' },
  actions:      {},
  resourceType: 'persistentvolumeclaim',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        0,
  data:         []
};

// GET /v1/persistentvolumeclaim - small set of persistentvolumeclaims data
const persistentvolumeclaimsResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumeclaims' },
  createTypes:  { persistentvolumeclaim: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumeclaims' },
  actions:      {},
  resourceType: 'persistentvolumeclaim',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        1,
  data:         [{
    id:    'cattle-system/test',
    type:  'persistentvolumeclaim',
    links: {
      remove: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumeclaims/cattle-system/test', self: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumeclaims/cattle-system/test', update: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumeclaims/cattle-system/test', view: 'https://yonasb29head.qa.rancher.space/api/v1/namespaces/cattle-system/persistentvolumeclaims/test'
    },
    apiVersion: 'v1',
    kind:       'PersistentVolumeClaim',
    metadata:   {
      creationTimestamp: '2024-07-05T00:27:43Z',
      fields:            ['test', 'Pending', '', '', '', '', '27s', 'Filesystem'],
      finalizers:        ['kubernetes.io/pvc-protection'],
      name:              'test',
      namespace:         'cattle-system',
      relationships:     null,
      resourceVersion:   '3952990',
      state:             {
        error: false, message: '', name: 'pending', transitioning: false
      },
      uid: '3afd226b-8841-4353-b1f5-51242cb40f80'
    },
    spec: {
      accessModes: ['ReadWriteOnce'], resources: { requests: { storage: '10Gi' } }, volumeMode: 'Filesystem'
    },
    status: { phase: 'Pending' }
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

export function persistentVolumeClaimsNoData(tag: string): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/persistentvolumeclaims?*', reply(200, persistentvolumeclaimsGetResponseEmpty)).as(tag);
}

export function generatePersistentVolumeClaimsDataSmall(tag: string): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/persistentvolumeclaims?*', reply(200, persistentvolumeclaimsResponseSmallSet)).as(tag);
}
