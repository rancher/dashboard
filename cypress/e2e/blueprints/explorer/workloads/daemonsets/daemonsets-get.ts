import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

const daemonSetsGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://localhost:8005/v1/apps.daemonsets' },
  createTypes:  { 'apps.daemonset': 'https://localhost:8005/v1/apps.daemonsets' },
  actions:      {},
  resourceType: 'apps.daemonset',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        1,
  data:         [{
    id:    'default/test1',
    type:  'apps.daemonset',
    links: {
      remove: 'https://localhost:8005/v1/apps.daemonsets/default/test1',
      self:   'https://localhost:8005/v1/apps.daemonsets/default/test1',
      update: 'https://localhost:8005/v1/apps.daemonsets/default/test1',
      view:   'https://localhost:8005/apis/apps/v1/namespaces/default/daemonsets/test1'
    },
    apiVersion: 'apps/v1',
    kind:       'DaemonSet',
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
      selector: { matchLabels: { app: 'test1' } },
      template: {
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
      currentNumberScheduled: 1,
      desiredNumberScheduled: 1,
      numberReady:            1
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

export function generateDaemonSetsDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/apps.daemonsets?*', reply(200, daemonSetsGetResponseSmallSet)).as('daemonSetsDataSmall');
}
