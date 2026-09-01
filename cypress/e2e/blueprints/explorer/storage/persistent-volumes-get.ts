import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../blueprint.utils';

// GET /v1/persistentvolumes- return empty persistentvolumes data
const persistentvolumesGetResponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumes' },
  createTypes:  { persistentvolume: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumes' },
  actions:      {},
  resourceType: 'persistentvolume',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        0,
  data:         []
};

// GET /v1/persistentvolumes - small set of persistentvolumes data
const persistentvolumesResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumes' },
  createTypes:  { persistentvolume: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumes' },
  actions:      {},
  resourceType: 'persistentvolume',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        1,
  data:         [{
    id:    'test',
    type:  'persistentvolume',
    links: {
      remove: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumes/test',
      self:   'https://yonasb29head.qa.rancher.space/v1/persistentvolumes/test',
      update: 'https://yonasb29head.qa.rancher.space/v1/persistentvolumes/test',
      view:   'https://yonasb29head.qa.rancher.space/api/v1/persistentvolumes/test'
    },
    apiVersion: 'v1',
    kind:       'PersistentVolume',
    metadata:   {
      creationTimestamp: '2024-07-04T23:53:54Z',
      fields:            ['test', '10Gi', 'RWO', 'Retain', 'Available', '', '', '', '48s', 'Filesystem'],
      finalizers:        ['kubernetes.io/pv-protection'],
      name:              'test',
      relationships:     null,
      resourceVersion:   '3940365',
      state:             {
        error: false, message: '', name: 'available', transitioning: false
      },
      uid: '7141da9d-1195-458c-8191-e94bcf252b16'
    },
    spec: {
      accessModes: ['ReadWriteOnce'], awsElasticBlockStore: { volumeID: 'volume1' }, capacity: { storage: '10Gi' }, persistentVolumeReclaimPolicy: 'Retain', volumeMode: 'Filesystem'
    },
    status: { phase: 'Available' }
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

export function persistentVolumesNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/persistentvolumes?*', reply(200, persistentvolumesGetResponseEmpty)).as('persistentvolumesNoData');
}

export function generatePersistentVolumesDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/persistentvolumes?*', reply(200, persistentvolumesResponseSmallSet)).as('persistentvolumesDataSmall');
}
