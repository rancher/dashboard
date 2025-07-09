import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

const statefulSetsGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://localhost:8005/v1/apps.statefulsets' },
  createTypes:  { 'apps.statefulset': 'https://localhost:8005/v1/apps.statefulsets' },
  actions:      {},
  resourceType: 'apps.statefulset',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        1,
  data:         [{
    id:    'default/test1',
    type:  'apps.statefulset',
    links: {
      remove: 'https://localhost:8005/v1/apps.statefulsets/default/test1',
      self:   'https://localhost:8005/v1/apps.statefulsets/default/test1',
      update: 'https://localhost:8005/v1/apps.statefulsets/default/test1',
      view:   'https://localhost:8005/apis/apps/v1/namespaces/default/statefulsets/test1'
    },
    apiVersion: 'apps/v1',
    kind:       'StatefulSet',
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
      replicas:            1,
      serviceName:         'test1',
      podManagementPolicy: 'OrderedReady',
      updateStrategy:      { type: 'RollingUpdate' },
      selector:            { matchLabels: { app: 'test1' } },
      template:            {
        metadata: { labels: { app: 'test1' } },
        spec:     {
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
      replicas:        1,
      readyReplicas:   1,
      currentReplicas: 1,
      updatedReplicas: 1
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

export function generateStatefulSetsDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/apps.statefulsets?*', reply(200, statefulSetsGetResponseSmallSet)).as('statefulSetsDataSmall');
}
