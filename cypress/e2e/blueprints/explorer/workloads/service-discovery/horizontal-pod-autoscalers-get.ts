import { CYPRESS_SAFE_RESOURCE_REVISION } from '../../../blueprint.utils';

// GET /v1/autoscaling.horizontalpodautoscalers - return empty horizontalpodautoscalers data
const horizontalpodautoscalerGetResponseEmpty = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/autoscaling.horizontalpodautoscalers' },
  createTypes:  { 'autoscaling.horizontalpodautoscaler': 'https://yonasb29head.qa.rancher.space/v1/autoscaling.horizontalpodautoscalers' },
  actions:      {},
  resourceType: 'autoscaling.horizontalpodautoscaler',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        0,
  data:         []
};

// GET /v1/autoscaling.horizontalpodautoscalers - small set of horizontalpodautoscalers data
const horizontalpodautoscalerGetResponseSmallSet = {
  type:         'collection',
  links:        { self: 'https://yonasb29head.qa.rancher.space/v1/autoscaling.horizontalpodautoscalers' },
  createTypes:  { 'autoscaling.horizontalpodautoscaler': 'https://yonasb29head.qa.rancher.space/v1/autoscaling.horizontalpodautoscalers' },
  actions:      {},
  resourceType: 'autoscaling.horizontalpodautoscaler',
  revision:     CYPRESS_SAFE_RESOURCE_REVISION,
  count:        1,
  data:         [
    {
      id:    'cattle-system/test',
      type:  'autoscaling.horizontalpodautoscaler',
      links: {
        remove: 'https://yonasb29head.qa.rancher.space/v1/autoscaling.horizontalpodautoscalers/cattle-system/test', self: 'https://yonasb29head.qa.rancher.space/v1/autoscaling.horizontalpodautoscalers/cattle-system/test', update: 'https://yonasb29head.qa.rancher.space/v1/autoscaling.horizontalpodautoscalers/cattle-system/test', view: 'https://yonasb29head.qa.rancher.space/apis/autoscaling/v2/namespaces/cattle-system/horizontalpodautoscalers/test'
      },
      apiVersion: 'autoscaling/v2',
      kind:       'HorizontalPodAutoscaler',
      metadata:   {
        annotations:       { 'field.cattle.io/description': 'test' },
        creationTimestamp: '2024-07-04T19:15:24Z',
        fields:            ['test', 'Deployment/rancher', '\u003cunknown\u003e/80%', '1', 10, 3, '3m18s'],
        name:              'test',
        namespace:         'cattle-system',
        relationships:     null,
        resourceVersion:   '3839186',
        state:             {
          error: true, message: 'the HPA was unable to compute the replica count: failed to get cpu utilization: missing request for cpu in container rancher of Pod rancher-6f5f99c7db-f8f86', name: 'pending', transitioning: false
        },
        uid: 'eee41148-d897-496f-abf6-539e842a6673'
      },
      spec: {
        maxReplicas:    10,
        metrics:        [{ resource: { name: 'cpu', target: { averageUtilization: 80, type: 'Utilization' } }, type: 'Resource' }],
        minReplicas:    1,
        scaleTargetRef: {
          apiVersion: 'apps/v1', kind: 'Deployment', name: 'rancher'
        }
      },
      status: {
        conditions: [{
          error: false, lastTransitionTime: '2024-07-04T19:15:39Z', lastUpdateTime: '2024-07-04T19:15:39Z', message: "the HPA controller was able to get the target's current scale", reason: 'SucceededGetScale', status: 'True', transitioning: false, type: 'AbleToScale'
        }, {
          error: true, lastTransitionTime: '2024-07-04T19:15:39Z', lastUpdateTime: '2024-07-04T19:15:39Z', message: 'the HPA was unable to compute the replica count: failed to get cpu utilization: missing request for cpu in container rancher of Pod rancher-6f5f99c7db-f8f86', reason: 'FailedGetResourceMetric', status: 'False', transitioning: false, type: 'ScalingActive'
        }],
        currentMetrics:  null,
        currentReplicas: 3,
        desiredReplicas: 0
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

export function horizontalPodAutoScalersNoData(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/autoscaling.horizontalpodautoscalers?*', reply(200, horizontalpodautoscalerGetResponseEmpty)).as('horizontalpodautoscalerNoData');
}

export function generateHorizontalPodAutoscalersDataSmall(): Cypress.Chainable<Response> {
  return cy.intercept('GET', '/v1/autoscaling.horizontalpodautoscalers?*', reply(200, horizontalpodautoscalerGetResponseSmallSet)).as('horizontalpodautoscalerDataSmall');
}
