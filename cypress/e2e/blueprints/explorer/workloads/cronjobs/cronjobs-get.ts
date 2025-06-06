import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

const cronJobsGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://localhost:8005/v1/batch.cronjobs' },
  createTypes:  { 'batch.cronjob': 'https://localhost:8005/v1/batch.cronjobs' },
  actions:      {},
  resourceType: 'batch.cronjob',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        1,
  data:         [{
    id:    'default/test1',
    type:  'batch.cronjob',
    links: {
      remove: 'https://localhost:8005/v1/batch.cronjobs/default/test1',
      self:   'https://localhost:8005/v1/batch.cronjobs/default/test1',
      update: 'https://localhost:8005/v1/batch.cronjobs/default/test1',
      view:   'https://localhost:8005/apis/batch/v1/namespaces/default/cronjobs/test1'
    },
    apiVersion: 'batch/v1',
    kind:       'CronJob',
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
      schedule:                   '*/1 * * * *',
      concurrencyPolicy:          'Allow',
      failedJobsHistoryLimit:     1,
      successfulJobsHistoryLimit: 3,
      suspend:                    false,
      jobTemplate:                {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  image: 'nginx:latest',
                  name:  'container-0'
                }
              ],
              restartPolicy: 'OnFailure'
            }
          }
        }
      }
    },
    status: {
      active:           [],
      lastScheduleTime: '2024-08-07T23:58:00Z'
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

export function generateCronJobsDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/batch.cronjobs?*', reply(200, cronJobsGetResponseSmallSet)).as('cronJobsDataSmall');
}
