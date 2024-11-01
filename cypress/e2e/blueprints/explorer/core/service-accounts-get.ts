import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../blueprint.utils';

// GET /v1/serviceaccounts - return empty service accounts data
const serviceAccGetResponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29.qa.rancher.space/v1/serviceaccounts' },
  createTypes:  { serviceaccount: 'https://yonasb29.qa.rancher.space/v1/serviceaccounts' },
  actions:      {},
  resourceType: 'serviceaccount',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        0,
  data:         []
};

// GET /v1/serviceaccounts - small set of service accounts data
const serviceAcctResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29.qa.rancher.space/v1/serviceaccounts' },
  createTypes:  { serviceaccount: 'https://yonasb29.qa.rancher.space/v1/serviceaccounts' },
  actions:      {},
  resourceType: 'serviceaccount',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        3,
  data:         [
    {
      id:    'cattle-system/default',
      type:  'serviceaccount',
      links: {
        remove: 'https://yonasb29.qa.rancher.space/v1/serviceaccounts/cattle-system/default',
        self:   'https://yonasb29.qa.rancher.space/v1/serviceaccounts/cattle-system/default',
        update: 'https://yonasb29.qa.rancher.space/v1/serviceaccounts/cattle-system/default',
        view:   'https://yonasb29.qa.rancher.space/api/v1/namespaces/cattle-system/serviceaccounts/default'
      },
      apiVersion:                   'v1',
      automountServiceAccountToken: false,
      kind:                         'ServiceAccount',
      metadata:                     {
        creationTimestamp: '2024-06-18T15:41:39Z',
        fields:            [
          'default',
          0,
          '6h13m'
        ],
        name:          'default',
        namespace:     'cattle-system',
        relationships: [
          {
            fromId:   'cattle-system/helm-operation-kjttr',
            fromType: 'pod',
            rel:      'uses',
            state:    'succeeded'
          },
          {
            fromId:   'cattle-system/helm-operation-zsx84',
            fromType: 'pod',
            rel:      'uses',
            state:    'succeeded'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: 'a60fc248-faea-47d7-a2f5-d7bf759c48ad'
      }
    },
    {
      id:    'cattle-fleet-local-system/default',
      type:  'serviceaccount',
      links: {
        remove: 'https://yonasb29.qa.rancher.space/v1/serviceaccounts/cattle-fleet-local-system/default',
        self:   'https://yonasb29.qa.rancher.space/v1/serviceaccounts/cattle-fleet-local-system/default',
        update: 'https://yonasb29.qa.rancher.space/v1/serviceaccounts/cattle-fleet-local-system/default',
        view:   'https://yonasb29.qa.rancher.space/api/v1/namespaces/cattle-fleet-local-system/serviceaccounts/default'
      },
      apiVersion:                   'v1',
      automountServiceAccountToken: false,
      kind:                         'ServiceAccount',
      metadata:                     {
        annotations: {
          'meta.helm.sh/release-name':       'fleet-agent-local',
          'meta.helm.sh/release-namespace':  'cattle-fleet-local-system',
          'objectset.rio.cattle.io/applied': 'H4sIAAAAAAAA/3yOS27DMAwF78K17aZK/NOuZ2guQMtPjVpJNCy6QBHk7oXjfZYzJDi8E28qSbasn1h/g8OHcztd5QeZrOdYUFGC8szKZO/EOYuyBsllR5m+4bRAmzVI41g1ognyFmay5COgNX8haz2JaNGVl/pYqo9hFMexLn9FkehRkVvxPH4NCUU5LWTzFmNFkSfEl8kblxtZOnfmZM6+bw16/z4O4zxMXWtwMuM0G9e1A6N3l8tey5xAlmZ43qLSIcrCbrcv/nz8BwAA//9WyRCROQEAAA',
          'objectset.rio.cattle.io/id':      'fleet-agent-bootstrap-cattle-fleet-local-system'
        },
        creationTimestamp: '2024-06-18T15:48:26Z',
        fields:            [
          'default',
          0,
          '6h6m'
        ],
        labels: {
          'app.kubernetes.io/managed-by': 'Helm',
          'objectset.rio.cattle.io/hash': '362023f752e7f1989d8b652e029bd2c658ae7c44'
        },
        name:          'default',
        namespace:     'cattle-fleet-local-system',
        relationships: [
          {
            fromId:   'cattle-fleet-local-system/fleet-agent-local',
            fromType: 'catalog.cattle.io.app',
            rel:      'helmresource',
            state:    'deployed'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '003b0146-d4c0-4ae8-8736-2183d675ebc9'
      }
    },
    {
      id:    'cattle-fleet-local-system/fleet-agent',
      type:  'serviceaccount',
      links: {
        remove: 'https://yonasb29.qa.rancher.space/v1/serviceaccounts/cattle-fleet-local-system/fleet-agent',
        self:   'https://yonasb29.qa.rancher.space/v1/serviceaccounts/cattle-fleet-local-system/fleet-agent',
        update: 'https://yonasb29.qa.rancher.space/v1/serviceaccounts/cattle-fleet-local-system/fleet-agent',
        view:   'https://yonasb29.qa.rancher.space/api/v1/namespaces/cattle-fleet-local-system/serviceaccounts/fleet-agent'
      },
      apiVersion: 'v1',
      kind:       'ServiceAccount',
      metadata:   {
        annotations: {
          'meta.helm.sh/release-name':       'fleet-agent-local',
          'meta.helm.sh/release-namespace':  'cattle-fleet-local-system',
          'objectset.rio.cattle.io/applied': 'H4sIAAAAAAAA/3yOS3LDMAhA78I6clMl/ukcvQCScKMOEh5DF51M7t5xverGS3gM7z2hkmFGQwhPwNbE0Io03UeJX5RMybqtSJfQjKkr8lYyBFiYyBx+UjMXRUxtw9UdR+6ALAnZ6Y8aVXhdIG309/yjVFLDukJo38wXYIzEp8oH6gMC3AZ/9bdl7D2Ny/s8zXmKQ+/p6ueYfRr6CWlM9/tua1jpfyccS10x7eSk9fUbAAD//wMiIUgYAQAA',
          'objectset.rio.cattle.io/id':      'fleet-agent-bootstrap-cattle-fleet-local-system'
        },
        creationTimestamp: '2024-06-18T15:48:28Z',
        fields:            [
          'fleet-agent',
          0,
          '6h6m'
        ],
        labels: {
          'app.kubernetes.io/managed-by': 'Helm',
          'objectset.rio.cattle.io/hash': '362023f752e7f1989d8b652e029bd2c658ae7c44'
        },
        name:          'fleet-agent',
        namespace:     'cattle-fleet-local-system',
        relationships: [
          {
            fromId:   'cattle-fleet-local-system/fleet-agent-0',
            fromType: 'pod',
            rel:      'uses',
            state:    'running'
          },
          {
            fromId:   'cattle-fleet-local-system/fleet-agent',
            fromType: 'apps.statefulset',
            rel:      'uses',
            state:    'active',
            message:  'Partition rollout complete. updated: 1'
          },
          {
            fromId:   'cattle-fleet-local-system/fleet-agent-local',
            fromType: 'catalog.cattle.io.app',
            rel:      'helmresource',
            state:    'deployed'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: 'de615799-099c-4088-809c-8cf00122c0fa'
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

export function serviceAccNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/serviceaccounts?*', reply(200, serviceAccGetResponseEmpty)).as('serviceAccNoData');
}

export function generateServiceAccDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/serviceaccounts?*', reply(200, serviceAcctResponseSmallSet)).as('serviceAccDataSmall');
}
