import { CYPRESS_SAFE_RESOURCE_REVISION } from '../blueprint.utils';

// GET /v1/fleet.cattle.io.clusterregistrationtokens - return empty clusterregistrationtokens data
const clusterRegistrationTokensGetReponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29h3.qa.rancher.space/v1/fleet.cattle.io.clusterregistrationtokens' },
  createTypes:  { 'fleet.cattle.io.clusterregistrationtoken': 'https://yonasb29h3.qa.rancher.space/v1/fleet.cattle.io.clusterregistrationtokens' },
  actions:      {},
  resourceType: 'fleet.cattle.io.clusterregistrationtoken',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        0,
  data:         []
};

// GET /v1/fleet.cattle.io.clusterregistrationtokens - small set of clusterregistrationtokens data
const clusterRegistrationTokensGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29h3.qa.rancher.space/v1/fleet.cattle.io.clusterregistrationtokens' },
  createTypes:  { 'fleet.cattle.io.clusterregistrationtoken': 'https://yonasb29h3.qa.rancher.space/v1/fleet.cattle.io.clusterregistrationtokens' },
  actions:      {},
  resourceType: 'fleet.cattle.io.clusterregistrationtoken',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        1,
  data:         [
    {
      id:    'fleet-default/test',
      type:  'fleet.cattle.io.clusterregistrationtoken',
      links: {
        remove: 'https://yonasb29h3.qa.rancher.space/v1/fleet.cattle.io.clusterregistrationtokens/fleet-default/test',
        self:   'https://yonasb29h3.qa.rancher.space/v1/fleet.cattle.io.clusterregistrationtokens/fleet-default/test',
        update: 'https://yonasb29h3.qa.rancher.space/v1/fleet.cattle.io.clusterregistrationtokens/fleet-default/test',
        view:   'https://yonasb29h3.qa.rancher.space/apis/fleet.cattle.io/v1alpha1/namespaces/fleet-default/clusterregistrationtokens/test'
      },
      apiVersion: 'fleet.cattle.io/v1alpha1',
      kind:       'ClusterRegistrationToken',
      metadata:   {
        creationTimestamp: '2024-07-09T19:39:33Z',
        fields:            [
          'test',
          'test'
        ],
        generation:    1,
        name:          'test',
        namespace:     'fleet-default',
        relationships: [
          {
            toId:    'fleet-default/test-9533c6e2-8633-48ca-87e3-2cd84c1cdf09',
            toType:  'serviceaccount',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'cattle-fleet-clusters-system/test-9533c6e2-8633-48ca-87e3-2cd84c1cdf09-creds',
            toType:  'rbac.authorization.k8s.io.role',
            rel:     'applies',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'fleet-default/test-9533c6e2-8633-48ca-87e3-2cd84c1cdf09-role',
            toType:  'rbac.authorization.k8s.io.role',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'cattle-fleet-clusters-system/test-9533c6e2-8633-48ca-87e3-2cd84c1cdf09-creds',
            toType:  'rbac.authorization.k8s.io.rolebinding',
            rel:     'applies',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'fleet-default/test-9533c6e2-8633-48ca-87e3-2cd84c1cdf09-to-role',
            toType:  'rbac.authorization.k8s.io.rolebinding',
            rel:     'owner',
            state:   'active',
            message: 'Resource is current'
          },
          {
            toId:    'fleet-default/test',
            toType:  'secret',
            rel:     'owner',
            state:   'active',
            message: 'Resource is always ready'
          }
        ],
        resourceVersion: CYPRESS_SAFE_RESOURCE_REVISION,
        state:           {
          error:         false,
          message:       'Resource is current',
          name:          'active',
          transitioning: false
        },
        uid: '9533c6e2-8633-48ca-87e3-2cd84c1cdf09'
      },
      status: { secretName: 'test' }
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

export function clusterRegistrationTokensNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/fleet.cattle.io.clusterregistrationtokens?*', reply(200, clusterRegistrationTokensGetReponseEmpty)).as('clusterRegistrationTokensNoData');
}

export function generateclusterRegistrationTokensDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/fleet.cattle.io.clusterregistrationtokens?*', reply(200, clusterRegistrationTokensGetResponseSmallSet)).as('clusterRegistrationTokensDataSmall');
}
