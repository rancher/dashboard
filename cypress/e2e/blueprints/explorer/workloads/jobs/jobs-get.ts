import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

const jobsGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://localhost:8005/v1/batch.jobs' },
  createTypes:  { 'batch.job': 'https://localhost:8005/v1/batch.jobs' },
  actions:      {},
  resourceType: 'batch.job',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        1,
  data:         [{
    id:    'default/test1',
    type:  'batch.job',
    links: {
      remove: 'https://localhost:8005/v1/batch.jobs/default/test1',
      self:   'https://localhost:8005/v1/batch.jobs/default/test1',
      update: 'https://localhost:8005/v1/batch.jobs/default/test1',
      view:   'https://localhost:8005/apis/batch/v1/namespaces/default/jobs/test1'
    },
    apiVersion: 'batch/v1',
    kind:       'Job',
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
      backoffLimit: 6,
      completions:  1,
      parallelism:  1,
      selector:     { matchLabels: { 'job-name': 'test1' } },
      template:     {
        metadata: { labels: { 'job-name': 'test1' } },
        spec:     {
          containers: [
            {
              image: 'nginx:latest',
              name:  'container-0'
            }
          ],
          restartPolicy: 'Never'
        }
      }
    },
    status: {
      active:    1,
      succeeded: 0,
      failed:    0
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

export function generateJobsDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/batch.jobs?*', reply(200, jobsGetResponseSmallSet)).as('jobsDataSmall');
}
