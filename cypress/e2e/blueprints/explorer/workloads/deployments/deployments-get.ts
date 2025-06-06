import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

const deploymentsGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://localhost:8005/v1/apps.deployments' },
  createTypes:  { 'apps.deployment': 'https://localhost:8005/v1/apps.deployments' },
  actions:      {},
  resourceType: 'apps.deployment',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        1,
  data:         [{
    id:    'default/test1',
    type:  'apps.deployment',
    links: {
      remove: 'https://localhost:8005/v1/apps.deployments/default/test1',
      self:   'https://localhost:8005/v1/apps.deployments/default/test1',
      update: 'https://localhost:8005/v1/apps.deployments/default/test1',
      view:   'https://localhost:8005/apis/apps/v1/namespaces/default/deployments/test1'
    },
    apiVersion: 'apps/v1',
    kind:       'Deployment',
    metadata:   {
      creationTimestamp: '2024-08-07T23:58:10Z',
      name:              'test1',
      namespace:         'default',
      resourceVersion:   CYPRESS_SAFE_RESOURCE_REVISION,
      state:             {
        error:         false,
        message:       '',
        name:          'active',
        transitioning: false
      }
    },
    spec: {
      replicas: 1,
      template: {
        spec: {
          containers: [
            {
              image: 'nginx:latest',
              name:  'container-0'
            }
          ]
        }
      }
    },
    status: {
      availableReplicas: 1,
      readyReplicas:     1,
      replicas:          1
    }
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

export function generateDeploymentsDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/apps.deployments?*', reply(200, deploymentsGetResponseSmallSet)).as('deploymentsDataSmall');
}
